// eslint-disable-next-line max-classes-per-file
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { objectIndexToArrays, objectIndexToSets } from 'shared/data_utils/objectIndex';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { HubDataSource } from '../contracts/HubDataSource';
import { V1ConnectionsDataSource } from '../contracts/V1ConnectionsDataSource';
import { V1Connection, V1ConnectionDisplayed } from '../model/V1Connection';
import { EntityPointer, Relationship } from '../model/Relationship';

const HUB_BATCH_SIZE = 1000;

class RelationshipMatcher {
  readonly fieldLibrary: Record<string, Record<string, Set<string | undefined>>>;

  constructor(v1RelationshipFields: V1RelationshipProperty[]) {
    const groupedByTemplate = objectIndexToArrays(
      v1RelationshipFields,
      field => field.template,
      field => field
    );
    this.fieldLibrary = Object.fromEntries(
      Object.entries(groupedByTemplate).map(([template, fields]) => [
        template,
        objectIndexToSets(
          fields,
          field => field.relationType,
          field => field.content
        ),
      ])
    );
  }

  matches(first: V1ConnectionDisplayed, second: V1ConnectionDisplayed) {
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

  static transform(first: V1Connection, second: V1Connection, newId: string) {
    const sourcePointer = new EntityPointer(first.entity);
    const targetPointer = new EntityPointer(second.entity);
    const relationshipType = second.template;
    if (!relationshipType) {
      throw new Error(
        `A Relationship going from ${first.entity} to ${second.entity} has no template.`
      );
    }
    return new Relationship(newId, sourcePointer, targetPointer, relationshipType);
  }
}

class Statistics {
  total: number = 0;

  used: number = 0;

  totalTextReferences: number = 0;

  usedTextReferences: number = 0;

  constructor() {
    this.total = 0;
    this.used = 0;
    this.totalTextReferences = 0;
    this.usedTextReferences = 0;
  }

  add(second: Statistics) {
    this.total += second.total;
    this.used += second.used;
    this.totalTextReferences += second.totalTextReferences;
    this.usedTextReferences += second.usedTextReferences;
  }
}

export class MigrationService {
  private idGenerator: IdGenerator;

  private hubsDS: HubDataSource;

  private v1ConnectionsDS: V1ConnectionsDataSource;

  private templatesDS: TemplatesDataSource;

  private relationshipsDS: RelationshipsDataSource;

  constructor(
    idGenerator: IdGenerator,
    hubsDS: HubDataSource,
    v1ConnectionsDS: V1ConnectionsDataSource,
    templatesDS: TemplatesDataSource,
    relationshipsDS: RelationshipsDataSource
  ) {
    this.idGenerator = idGenerator;
    this.hubsDS = hubsDS;
    this.v1ConnectionsDS = v1ConnectionsDS;
    this.templatesDS = templatesDS;
    this.relationshipsDS = relationshipsDS;
  }

  private async readV1RelationshipFields() {
    const relProps = (await this.templatesDS.getAllProperties().all()).filter(
      p => p instanceof V1RelationshipProperty
    );
    const matcher = new RelationshipMatcher(relProps as V1RelationshipProperty[]);
    return matcher;
  }

  private async gatherHubs() {
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

  private transformHub(
    connections: V1ConnectionDisplayed[],
    matcher: RelationshipMatcher,
    transform: boolean = false
  ) {
    const stats = new Statistics();
    stats.total = connections.length;
    stats.totalTextReferences = connections.filter(c => c.file).length;
    const usedConnections: Record<string, V1ConnectionDisplayed> = {};
    const transformed: Relationship[] = [];
    connections.forEach(first => {
      connections.forEach(second => {
        if (first.id !== second.id && matcher.matches(first, second)) {
          usedConnections[first.id] = first;
          usedConnections[second.id] = second;
          if (transform) {
            transformed.push(
              RelationshipMatcher.transform(first, second, this.idGenerator.generate())
            );
          }
        }
      });
    });
    stats.used = Object.keys(usedConnections).length;
    stats.usedTextReferences = Object.values(usedConnections).filter(c => c.file).length;
    return { stats, transformed };
  }

  private async transformHubs(
    matcher: RelationshipMatcher,
    transform: boolean = false,
    write: boolean = false
  ) {
    const hubCursor = this.hubsDS.all();
    const stats = new Statistics();
    await hubCursor.forEachBatch(HUB_BATCH_SIZE, async hubIdBatch => {
      const connections = await this.v1ConnectionsDS.getConnectedToHubs(hubIdBatch).all();
      const connectionsGrouped = objectIndexToArrays(
        connections,
        connection => connection.hub,
        connection => connection
      );
      const connectionGroups = Array.from(Object.values(connectionsGrouped));
      const transformed: Relationship[] = [];
      for (let i = 0; i < connectionGroups.length; i += 1) {
        const { stats: groupStats, transformed: groupTransformed } = this.transformHub(
          connectionGroups[i],
          matcher,
          transform
        );
        stats.add(groupStats);
        transformed.push(...groupTransformed);
      }
      if (write) {
        await this.relationshipsDS.insert(transformed);
      }
    });
    return stats;
  }

  async testOneHub(hubId: string) {
    const matcher = await this.readV1RelationshipFields();

    const connected = await this.v1ConnectionsDS.getConnectedToHubs([hubId]).all();
    const { stats, transformed } = this.transformHub(connected, matcher, true);

    return {
      total: stats.total,
      used: stats.used,
      totalTextReferences: stats.totalTextReferences,
      usedTextReferences: stats.usedTextReferences,
      transformed,
      original: connected,
    };
  }

  async migrate(dryRun: boolean) {
    await this.hubsDS.create();

    const matcher = await this.readV1RelationshipFields();
    await this.gatherHubs();
    const transformAndWrite = !dryRun;
    const { total, used, totalTextReferences, usedTextReferences } = await this.transformHubs(
      matcher,
      transformAndWrite,
      transformAndWrite
    );

    await this.hubsDS.drop();

    return { total, used, totalTextReferences, usedTextReferences };
  }
}
