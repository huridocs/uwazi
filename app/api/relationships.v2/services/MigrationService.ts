// eslint-disable-next-line max-classes-per-file
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
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
  readonly fieldLibrary: Record<string, Record<string, Set<string>>>;

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
      sourceEntityTemplate in this.fieldLibrary &&
      relationshipType in this.fieldLibrary[sourceEntityTemplate] &&
      (this.fieldLibrary[sourceEntityTemplate][relationshipType].has(targetEntityTemplate) ||
        this.fieldLibrary[sourceEntityTemplate][relationshipType].has(
          V1RelationshipProperty.ALL_MARKER
        ))
    );
  }

  static transform(first: V1Connection, second: V1Connection, newId: string) {
    const sourcePointer = new EntityPointer(first.entity);
    const targetPointer = new EntityPointer(second.entity);
    const relationshipType = second.template;
    return new Relationship(newId, sourcePointer, targetPointer, relationshipType);
  }
}

export class MigrationService {
  private transactionManager: MongoTransactionManager;

  private idGenerator: IdGenerator;

  private hubsDS: HubDataSource;

  private v1ConnectionsDS: V1ConnectionsDataSource;

  private templatesDS: TemplatesDataSource;

  private relationshipsDS: RelationshipsDataSource;

  constructor(
    transactionManager: MongoTransactionManager,
    idGenerator: IdGenerator,
    hubsDS: HubDataSource,
    v1ConnectionsDS: V1ConnectionsDataSource,
    templatesDS: TemplatesDataSource,
    relationshipsDS: RelationshipsDataSource
  ) {
    this.transactionManager = transactionManager;
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

  private async gatherHubs(limit?: number) {
    const cursor = this.v1ConnectionsDS.allCursor();

    let hubIds: Set<string> = new Set();
    // eslint-disable-next-line no-await-in-loop
    while ((await cursor.hasNext()) && (limit === undefined || hubIds.size < limit)) {
      // eslint-disable-next-line no-await-in-loop
      const connection = await cursor.next();
      if (connection) hubIds.add(connection.hub);
      if (hubIds.size >= HUB_BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        await this.hubsDS.insertIds(Array.from(hubIds));
        hubIds = new Set();
      }
    }
    await this.hubsDS.insertIds(Array.from(hubIds));
  }

  private async transformHub(
    connections: V1ConnectionDisplayed[],
    matcher: RelationshipMatcher,
    transform: boolean = false
  ) {
    const total = connections.length;
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
    const used = Object.keys(usedConnections).length;
    return { total, used, transformed };
  }

  private async transformHubs(
    matcher: RelationshipMatcher,
    transform: boolean = false,
    write: boolean = false
  ) {
    const hubCursor = this.hubsDS.all();
    let total = 0;
    let used = 0;
    // eslint-disable-next-line no-await-in-loop
    while (await hubCursor.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      const hubIdBatch = await hubCursor.nextBatch(HUB_BATCH_SIZE);
      // eslint-disable-next-line no-await-in-loop
      const connections = await this.v1ConnectionsDS.getConnectedToHubs(hubIdBatch).all();
      const connectionsGrouped = objectIndexToArrays(
        connections,
        connection => connection.hub,
        connection => connection
      );
      const connectionGroups = Array.from(Object.values(connectionsGrouped));
      const transformed: Relationship[] = [];
      for (let i = 0; i < connectionGroups.length; i += 1) {
        const {
          total: groupTotal,
          used: groupUsed,
          transformed: groupTransformed,
          // eslint-disable-next-line no-await-in-loop
        } = await this.transformHub(connectionGroups[i], matcher, transform);
        total += groupTotal;
        used += groupUsed;
        transformed.push(...groupTransformed);
      }
      if (write) {
        // eslint-disable-next-line no-await-in-loop
        await this.relationshipsDS.insert(transformed);
      }
    }
    return { total, used };
  }

  async testOneHub(hubId: string) {
    const matcher = await this.readV1RelationshipFields();

    const connected = await this.v1ConnectionsDS.getConnectedToHubs([hubId]).all();
    const { total, used, transformed } = await this.transformHub(connected, matcher, true);

    return { total, used, transformed, original: connected };
  }

  async migrate(dryRun: boolean) {
    await this.hubsDS.create();

    const matcher = await this.readV1RelationshipFields();
    await this.gatherHubs();
    const transformAndWrite = !dryRun;
    const { total, used } = await this.transformHubs(matcher, transformAndWrite, transformAndWrite);

    await this.hubsDS.drop();

    return { total, used };
  }
}
