/* eslint-disable max-lines */
// eslint-disable-next-line max-classes-per-file
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { SaveStream } from 'api/common.v2/contracts/SaveStream';
import { Logger } from 'api/log.v2/contracts/Logger';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { objectIndexToArrays, objectIndexToSets } from 'shared/data_utils/objectIndex';
import { TestOneHubRequest } from 'shared/types/api.v2/relationships.testOneHub';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { HubDataSource } from '../contracts/HubDataSource';
import { V1ConnectionsDataSource } from '../contracts/V1ConnectionsDataSource';
import { V1Connection, ReadableV1Connection, V1TextReference } from '../model/V1Connection';
import {
  EntityPointer,
  FilePointer,
  TextReferencePointer,
  Relationship,
  Selection,
} from '../model/Relationship';
import { MigrationHubRecordDataSource } from '../contracts/MigrationHubRecordDataSource';
import { MigrationHubRecord } from '../model/MigrationHubRecord';

const HUB_BATCH_SIZE = 1000;

class MissingFileNotRepairedError extends Error {}

type MigrationPlan = TestOneHubRequest['migrationPlan'];

class RelationshipMatcher {
  readonly fieldLibrary: Record<string, Record<string, Set<string | undefined>>>;

  constructor(migrationPlan: MigrationPlan) {
    const filteredPlan = migrationPlan.filter(field => !field.ignored);
    const groupedByTemplate = objectIndexToArrays(
      filteredPlan,
      field => field.sourceTemplateId,
      field => field
    );
    this.fieldLibrary = Object.fromEntries(
      Object.entries(groupedByTemplate).map(([template, fields]) => [
        template,
        objectIndexToSets(
          fields,
          field => field.relationTypeId,
          field => field.targetTemplateId
        ),
      ])
    );
  }

  matches(first: ReadableV1Connection, second: ReadableV1Connection) {
    const sourceEntityTemplate = first.entityTemplate;
    const relationshipType = second.template;
    const targetEntityTemplate = second.entityTemplate;
    return (
      sourceEntityTemplate &&
      targetEntityTemplate &&
      relationshipType &&
      sourceEntityTemplate in this.fieldLibrary &&
      relationshipType in this.fieldLibrary[sourceEntityTemplate] &&
      (this.fieldLibrary[sourceEntityTemplate][relationshipType].has(targetEntityTemplate) ||
        this.fieldLibrary[sourceEntityTemplate][relationshipType].has(undefined))
    );
  }
}

class Statistics {
  total: number = 0;

  used: number = 0;

  totalTextReferences: number = 0;

  usedTextReferences: number = 0;

  errors: number = 0;

  constructor() {
    this.total = 0;
    this.used = 0;
    this.totalTextReferences = 0;
    this.usedTextReferences = 0;
    this.errors = 0;
  }

  add(second: Statistics) {
    this.total += second.total;
    this.used += second.used;
    this.totalTextReferences += second.totalTextReferences;
    this.usedTextReferences += second.usedTextReferences;
    this.errors += second.errors;
  }
}

export class MigrationService {
  private idGenerator: IdGenerator;

  private hubsDS: HubDataSource;

  private v1ConnectionsDS: V1ConnectionsDataSource;

  private templatesDS: TemplatesDataSource;

  private relationshipsDS: RelationshipsDataSource;

  private hubRecordDS: MigrationHubRecordDataSource;

  private logger: Logger;

  constructor(
    idGenerator: IdGenerator,
    hubsDS: HubDataSource,
    v1ConnectionsDS: V1ConnectionsDataSource,
    templatesDS: TemplatesDataSource,
    relationshipsDS: RelationshipsDataSource,
    hubRecordDS: MigrationHubRecordDataSource,
    logger: Logger
  ) {
    this.idGenerator = idGenerator;
    this.hubsDS = hubsDS;
    this.v1ConnectionsDS = v1ConnectionsDS;
    this.templatesDS = templatesDS;
    this.relationshipsDS = relationshipsDS;
    this.hubRecordDS = hubRecordDS;
    this.logger = logger;
  }

  private logUnhandledError(error: Error, first: V1Connection, second: V1Connection): void {
    const message = [
      'V2 Relationship Migration Error:',
      'Unhandled error encountered:',
      error.stack || error.message,
      'Processed connections:',
      JSON.stringify(first, null, 2),
      JSON.stringify(second, null, 2),
    ];
    this.logger.error(message);
  }

  private async gatherHubs(): Promise<void> {
    const cursor = this.v1ConnectionsDS.all();

    let hubIds: Set<string> = new Set();
    await cursor.forEach(async connection => {
      if (connection) hubIds.add(connection.hub);
      if (hubIds.size >= HUB_BATCH_SIZE) {
        await this.hubsDS.insertIds(Array.from(hubIds));
        hubIds = new Set();
      }
    });
    await this.hubsDS.insertIds(Array.from(hubIds));
  }

  static transformReference(reference: V1TextReference): {
    text: string;
    selectionRectangles: Selection[];
  } {
    const { text } = reference;
    const selectionRectangles = reference.selectionRectangles.map(
      sr => new Selection(parseInt(sr.page, 10), sr.top, sr.left, sr.height, sr.width)
    );
    return {
      text,
      selectionRectangles,
    };
  }

  private async tryInferingFile(connection: V1Connection): Promise<string | null | undefined> {
    const similarConnections = this.v1ConnectionsDS.getSimilarConnections(connection);
    const candidate = await similarConnections.find(c => c.hasSameReferenceAs(connection));
    return candidate ? candidate.file : null;
  }

  private async transformPointer(v1Connection: V1Connection): Promise<EntityPointer | null> {
    if (v1Connection.isFilePointer()) {
      return new FilePointer(v1Connection.entity, v1Connection.file);
    }
    if (v1Connection.hasReference()) {
      const { text, selectionRectangles } = MigrationService.transformReference(
        v1Connection.reference
      );
      const inferredFile = v1Connection.file || (await this.tryInferingFile(v1Connection));
      if (!inferredFile) {
        return null;
      }
      return new TextReferencePointer(v1Connection.entity, inferredFile, selectionRectangles, text);
    }
    return new EntityPointer(v1Connection.entity);
  }

  private async transform(
    first: V1Connection,
    second: V1Connection,
    newId: string
  ): Promise<Relationship> {
    const sourcePointer = await this.transformPointer(first);
    const targetPointer = await this.transformPointer(second);
    const relationshipType = second.template;
    if (!relationshipType) {
      throw new Error(
        `A Relationship going from ${first.entity} to ${second.entity} has no template.`
      );
    }
    if (!sourcePointer || !targetPointer) {
      throw new MissingFileNotRepairedError('Could not repair a missing file pointer.');
    }
    return new Relationship(newId, sourcePointer, targetPointer, relationshipType);
  }

  private async transformPair(
    first: ReadableV1Connection,
    second: ReadableV1Connection,
    matcher: RelationshipMatcher,
    usedConnections: { [id: string]: ReadableV1Connection },
    transform: boolean,
    transformed: Relationship[],
    stats: Statistics
  ): Promise<void> {
    try {
      if (first.id !== second.id && matcher.matches(first, second)) {
        usedConnections[first.id] = first;
        usedConnections[second.id] = second;
        if (transform) {
          const trd = await this.transform(first, second, this.idGenerator.generate());
          transformed.push(trd);
        }
      }
    } catch (error) {
      stats.errors += 1;
      this.logUnhandledError(error, first, second);
    }
  }

  private async transformHub(
    connections: ReadableV1Connection[],
    matcher: RelationshipMatcher,
    transform: boolean = false
  ): Promise<{
    stats: Statistics;
    transformed: Relationship[];
  }> {
    const stats = new Statistics();
    stats.total = connections.length;
    stats.totalTextReferences = connections.filter(c => c.file).length;
    const usedConnections: Record<string, ReadableV1Connection> = {};
    const transformed: Relationship[] = [];
    await connections.reduce(async (batchPromise, first) => {
      await batchPromise;
      await connections.reduce(async (pairPromise, second) => {
        await pairPromise;
        return this.transformPair(
          first,
          second,
          matcher,
          usedConnections,
          transform,
          transformed,
          stats
        );
      }, Promise.resolve());
    }, Promise.resolve());
    stats.used = Object.keys(usedConnections).length;
    stats.usedTextReferences = Object.values(usedConnections).filter(c => c.file).length;
    return { stats, transformed };
  }

  private async recordUnusedConnections(
    unusedHubsSaveStream: SaveStream<MigrationHubRecord>,
    stats: Statistics,
    group: ReadableV1Connection[]
  ): Promise<void> {
    if (stats.total !== stats.used) {
      await unusedHubsSaveStream.push(new MigrationHubRecord(group[0].hub, group));
    }
  }

  private async writeTransformed(write: boolean, transformed: Relationship[]) {
    if (write && transformed.length > 0) {
      await this.relationshipsDS.insert(transformed);
    }
  }

  private async transformBatch(
    hubIdBatch: string[],
    matcher: RelationshipMatcher,
    stats: Statistics,
    unusedHubsSaveStream: SaveStream<MigrationHubRecord>,
    transform: boolean = false,
    write: boolean = false
  ): Promise<void> {
    const connections = await this.v1ConnectionsDS.getConnectedToHubs(hubIdBatch).all();
    const connectionsGrouped = objectIndexToArrays(
      connections,
      connection => connection.hub,
      connection => connection
    );
    const connectionGroups = Array.from(Object.values(connectionsGrouped));
    const transformed: Relationship[] = [];
    await connectionGroups.reduce(async (prevPromise, group) => {
      await prevPromise;
      const { stats: groupStats, transformed: groupTransformed } = await this.transformHub(
        group,
        matcher,
        transform
      );
      stats.add(groupStats);
      transformed.push(...groupTransformed);
      return this.recordUnusedConnections(unusedHubsSaveStream, groupStats, group);
    }, Promise.resolve());
    await this.writeTransformed(write, transformed);
  }

  private async transformHubs(
    matcher: RelationshipMatcher,
    transform: boolean = false,
    write: boolean = false
  ): Promise<{
    stats: Statistics;
  }> {
    const hubCursor = this.hubsDS.all();
    const unusedHubsSaveStream = this.hubRecordDS.openSaveStream();
    const stats = new Statistics();
    await hubCursor.forEachBatch(HUB_BATCH_SIZE, async hubIdBatch =>
      this.transformBatch(hubIdBatch, matcher, stats, unusedHubsSaveStream, transform, write)
    );
    await unusedHubsSaveStream.flush();
    return { stats };
  }

  async testOneHub(hubId: string, plan: MigrationPlan) {
    const matcher = new RelationshipMatcher(plan);

    const connected = await this.v1ConnectionsDS.getConnectedToHubs([hubId]).all();
    const { stats, transformed } = await this.transformHub(connected, matcher, true);

    return {
      total: stats.total,
      used: stats.used,
      totalTextReferences: stats.totalTextReferences,
      usedTextReferences: stats.usedTextReferences,
      errors: stats.errors,
      transformed,
      original: connected,
    };
  }

  async setupDB(transformAndWrite: boolean) {
    await this.hubsDS.create();
    await this.hubRecordDS.deleteAll();
    if (transformAndWrite) {
      await this.relationshipsDS.deleteAll();
    }
  }

  async migrate(dryRun: boolean, plan: MigrationPlan) {
    const transformAndWrite = !dryRun;
    await this.setupDB(transformAndWrite);

    const matcher = new RelationshipMatcher(plan);
    await this.gatherHubs();

    const transformResult = await this.transformHubs(matcher, transformAndWrite, transformAndWrite);
    const { total, used, totalTextReferences, usedTextReferences, errors } = transformResult.stats;

    await this.hubsDS.drop();

    return {
      total,
      used,
      totalTextReferences,
      usedTextReferences,
      errors,
    };
  }
}
