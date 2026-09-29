import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import {
  withConnectedData,
  processRelationshipCollection,
} from '#api/relationships/relationshipProcessing.js';
import model from '#api/relationships/model.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import type { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type {
  DeleteResult,
  EntityReferenceByRelationshipType,
  FindOptions,
  HubConnection,
  HubConnectionsOptions,
  Relation,
  RelationshipPropertyHubCandidate,
  RelationshipQuery,
  RelationshipsV1DataSource,
  RelationshipSourceEntity,
  RelationshipUpdate,
  SearchHub,
  V1Relationship,
} from '#shared/contracts/RelationshipsV1DataSource.js';
import { TimedMethod } from '#api/core/libs/logger/TimedMethodDecorator.js';

type SelectionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  page: string;
};

type HubConnectionDBO = {
  _id: ObjectId;
  hub: ObjectId;
  entity: string;
  template?: ObjectId | null;
  file?: ObjectId | string;
  reference?: {
    text: string;
    selectionRectangles?: SelectionRect[];
  };
  filename?: string;
  sharedId?: ObjectId;
};

const OBJECT_ID_FIELDS = ['_id', 'hub', 'template', 'sharedId'] as const;

export class MongoRelationshipsV1DataSource
  extends MongoDataSource<Record<string, unknown>>
  implements RelationshipsV1DataSource
{
  protected collectionName = 'connections';

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    private entitiesDAO: EntitiesDAO,
    private settingsDS: SettingsDataSource
  ) {
    super(db, transactionManager);
  }

  async find(query: RelationshipQuery = {}, options: FindOptions = {}): Promise<V1Relationship[]> {
    const cursor = this.getCollection().find(MongoRelationshipsV1DataSource.toMongoQuery(query));
    const docs = options.limit
      ? await cursor.limit(options.limit).toArray()
      : await cursor.toArray();
    return docs.map(doc => MongoRelationshipsV1DataSource.toV1Relationship(doc));
  }

  async findById(id: string): Promise<V1Relationship | null> {
    const doc = await this.getCollection().findOne({
      _id: MongoRelationshipsV1DataSource.toObjectId(id),
    });
    return doc ? MongoRelationshipsV1DataSource.toV1Relationship(doc) : null;
  }

  async count(query: RelationshipQuery = {}): Promise<number> {
    return this.getCollection().countDocuments(MongoRelationshipsV1DataSource.toMongoQuery(query));
  }

  async getHubConnections(
    entitiesSharedIds: string[],
    options: HubConnectionsOptions = {}
  ): Promise<V1Relationship[]> {
    const { file, onlyTextReferences } = options;
    const collection = this.getCollection();

    let ownFilter: Record<string, unknown> = { entity: { $in: entitiesSharedIds } };
    if (onlyTextReferences) {
      ownFilter = { ...ownFilter, $and: [{ file: { $exists: true } }, { file }] };
    } else if (file) {
      ownFilter = {
        ...ownFilter,
        $or: [{ file: { $exists: false } }, { $and: [{ file: { $exists: true } }, { file }] }],
      };
    }

    const ownRelations = onlyTextReferences
      ? await collection.find(ownFilter, { limit: 300 }).toArray()
      : await collection.find(ownFilter).toArray();

    const hubIds = ownRelations.map(relation => relation.hub);
    if (hubIds.length === 0) {
      return [];
    }

    const docs = await collection.find({ hub: { $in: hubIds } }).toArray();
    return docs.map(doc => MongoRelationshipsV1DataSource.toV1Relationship(doc));
  }

  async saveMultiple(documents: Partial<V1Relationship>[]): Promise<V1Relationship[]> {
    const saved = await model.saveMultiple(documents as Parameters<typeof model.saveMultiple>[0]);
    return saved.map(doc => MongoRelationshipsV1DataSource.toV1Relationship(doc));
  }

  async delete(query: RelationshipQuery): Promise<DeleteResult> {
    const relationsToDelete = await this.find(query);
    const hubsAffected = [
      ...new Set(
        relationsToDelete.map(relation => MongoRelationshipsV1DataSource.toStringId(relation.hub))
      ),
    ];

    const response = await this.getCollection().deleteMany(
      MongoRelationshipsV1DataSource.toMongoQuery(query)
    );

    const hubsToDelete = await this.getHubsToDelete(hubsAffected);
    if (hubsToDelete.length) {
      await this.getCollection().deleteMany({
        hub: { $in: hubsToDelete.map(id => MongoRelationshipsV1DataSource.toObjectId(id)) },
      });
    }

    return { acknowledged: response.acknowledged, deletedCount: response.deletedCount };
  }

  async updateMany(query: RelationshipQuery, update: RelationshipUpdate): Promise<void> {
    const operations: Record<string, unknown> = {};
    if (update.set) operations.$set = update.set;
    if (update.rename) operations.$rename = update.rename;
    if (update.unset) {
      operations.$unset = Object.fromEntries(update.unset.map(field => [field, '']));
    }
    await this.getCollection().updateMany(
      MongoRelationshipsV1DataSource.toMongoQuery(query),
      operations
    );
  }

  // ---------------------------------------------------------------- core read models

  @TimedMethod('MongoRelationshipsV1DataSource.getHubConnectionsForEntity')
  async getHubConnectionsForEntity(sharedId: string): Promise<HubConnection[]> {
    const ownRelations = await this.getCollection<{ hub: ObjectId }>()
      .find({ entity: sharedId }, { projection: { hub: 1 } })
      .toArray();

    const hubIds = ownRelations.map(relation => relation.hub);
    if (hubIds.length === 0) {
      return [];
    }

    const rows = await this.getCollection<HubConnectionDBO>()
      .find(
        { hub: { $in: hubIds } },
        {
          projection: {
            _id: 1,
            hub: 1,
            entity: 1,
            template: 1,
            file: 1,
            reference: 1,
            filename: 1,
            sharedId: 1,
          },
        }
      )
      .toArray();

    return rows.map(row => ({
      _id: String(row._id),
      hub: String(row.hub),
      entity: row.entity,
      template: row.template ? String(row.template) : null,
      ...(row.file ? { file: String(row.file) } : {}),
      ...(row.reference ? { reference: row.reference } : {}),
      ...(row.filename ? { filename: row.filename } : {}),
      ...(row.sharedId ? { sharedId: String(row.sharedId) } : {}),
    }));
  }

  async getByEntitySharedIds(sharedIds: string[]): Promise<Relation[]> {
    const ownRelations = await this.getCollection()
      .find({ entity: { $in: sharedIds } })
      .toArray();

    const dbRelationships = await this.getCollection()
      .find({ hub: { $in: ownRelations.map(relationship => relationship.hub) } })
      .toArray();

    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: dbRelationships.map(r => r.entity as string),
      language: await this.settingsDS.getDefaultLanguageKey(),
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    return withConnectedData(dbRelationships, connectedDocuments) as Relation[];
  }

  @TimedMethod('MongoRelationshipsV1DataSource.getByEntity')
  async getByEntity(
    sharedId: string,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    const hubRelations = await this.getHubConnections([sharedId]);
    if (hubRelations.length === 0) {
      return [];
    }

    const connectedSharedIds = [...new Set(hubRelations.map(relation => relation.entity))];
    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: connectedSharedIds,
      language,
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    return processRelationshipCollection({
      relationshipArray: hubRelations,
      connectedDocuments,
      sharedId,
      unpublished: includeUnpublished,
      language,
    }) as Relation[];
  }

  @TimedMethod('MongoRelationshipsV1DataSource.getEntityMetadataRelationships')
  async getEntityMetadataRelationships(
    entity: RelationshipSourceEntity,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    const referencedSharedIds = Array.from(
      entity.getReferencedRelationshipEntitySharedIds(language)
    );

    if (referencedSharedIds.length === 0) {
      return [];
    }

    const ownRelations = await this.getCollection()
      .find({ entity: entity.sharedId }, { projection: { hub: 1 } })
      .toArray();

    const hubIds = [...new Set(ownRelations.map(r => r.hub))];
    if (hubIds.length === 0) {
      return [];
    }

    const relevantConnections = await this.getCollection()
      .find({
        entity: { $in: referencedSharedIds },
        hub: { $in: hubIds },
      })
      .toArray();

    if (relevantConnections.length === 0) {
      return [];
    }

    const connectedSharedIds = [...new Set(relevantConnections.map(r => r.entity as string))];

    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: connectedSharedIds,
      language,
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    let relations = withConnectedData(relevantConnections, connectedDocuments);
    if (!includeUnpublished) {
      relations = relations.filter((r: any) => r.entityData?.published);
    }

    return relations as Relation[];
  }

  async deleteByFiles(fileIds: string[]): Promise<void> {
    await this.delete({ file: fileIds });
  }

  async bulkDeleteBySharedId(sharedIds: string[]): Promise<void> {
    await this.delete({ entity: sharedIds });
  }

  async getEntityReferencesByRelationshipTypes(
    sharedId: string,
    relationTypes: string[]
  ): Promise<Record<string, Record<string, EntityReferenceByRelationshipType>>> {
    const value = await this.getCollection()
      .aggregate([
        { $match: { entity: sharedId } },
        { $project: { hub: 1 } },
        {
          $lookup: { from: 'connections', localField: 'hub', foreignField: 'hub', as: 'rightSide' },
        },
        {
          $project: { hub: 1, 'rightSide._id': 1, 'rightSide.entity': 1, 'rightSide.template': 1 },
        },
        { $unwind: '$rightSide' },
        {
          $match: {
            'rightSide.template': {
              $in: relationTypes.map(t => MongoRelationshipsV1DataSource.toObjectId(t)),
            },
          },
        },
        {
          $lookup: {
            from: 'entities',
            localField: 'rightSide.entity',
            foreignField: 'sharedId',
            as: 'rightSide.entityData',
          },
        },
        {
          $project: {
            hub: 1,
            'rightSide._id': 1,
            'rightSide.entity': 1,
            'rightSide.template': 1,
            'rightSide.entityData.template': 1,
          },
        },
        { $group: { _id: '$rightSide.template', references: { $push: '$$ROOT' } } },
      ])
      .toArray();

    return Object.fromEntries(
      value.map(group => [
        String(group._id),
        Object.fromEntries(
          (group.references as any[]).map(r => [
            r.rightSide.entity,
            {
              hub: String(r.hub),
              rightSide: {
                _id: String(r.rightSide._id),
                entity: r.rightSide.entity,
                template: r.rightSide.template ? String(r.rightSide.template) : null,
                entityData: (r.rightSide.entityData || []).map((d: any) => ({
                  template: String(d.template),
                })),
              },
            },
          ])
        ),
      ])
    );
  }

  async guessRelationshipPropertyHub(
    sharedId: string,
    relationType: string
  ): Promise<RelationshipPropertyHubCandidate[]> {
    const value = await this.getCollection()
      .aggregate([
        { $match: { entity: sharedId } },
        {
          $lookup: { from: 'connections', localField: 'hub', foreignField: 'hub', as: 'rightSide' },
        },
        { $unwind: '$rightSide' },
        { $match: { 'rightSide.entity': { $ne: sharedId } } },
        { $group: { _id: '$rightSide.hub', templates: { $addToSet: '$rightSide.template' } } },
        {
          $match: {
            $and: [
              { 'templates.0': MongoRelationshipsV1DataSource.toObjectId(relationType) },
              { 'templates.1': { $exists: false } },
            ],
          },
        },
      ])
      .toArray();

    return value.map(r => ({
      _id: String(r._id),
      templates: r.templates.map((t: unknown) => String(t)),
    }));
  }

  async getRightSideConnections(
    entitySharedId: string,
    relationTypeFilter: (string | null)[]
  ): Promise<V1Relationship[]> {
    const hubsIds = (await this.getCollection().find({ entity: entitySharedId }).toArray()).map(
      r => r.hub
    );

    const docs = await this.getCollection()
      .find({
        hub: { $in: hubsIds },
        entity: { $ne: entitySharedId },
        ...(relationTypeFilter.length
          ? {
              template: {
                $in: relationTypeFilter.map(t =>
                  t === null ? null : MongoRelationshipsV1DataSource.toObjectId(t)
                ),
              },
            }
          : {}),
      })
      .toArray();

    return docs.map(doc => MongoRelationshipsV1DataSource.toV1Relationship(doc));
  }

  async getMatchingHubsCount(
    entitySharedId: string,
    searchResultIds: string[],
    filteredConnectionIds: string[]
  ): Promise<number> {
    const [countResult] = await this.getCollection()
      .aggregate([
        { $match: { entity: entitySharedId } },
        {
          $lookup: {
            from: 'connections',
            localField: 'hub',
            foreignField: 'hub',
            as: 'connections',
          },
        },
        {
          $match: {
            ...(filteredConnectionIds.length
              ? {
                  'connections._id': {
                    $in: filteredConnectionIds.map(id =>
                      MongoRelationshipsV1DataSource.toObjectId(id)
                    ),
                  },
                }
              : { 'connections.entity': { $in: searchResultIds } }),
          },
        },
        { $group: { _id: '$hub' } },
        { $count: 'total' },
      ])
      .toArray();

    return countResult?.total || 0;
  }

  async getHubsForSearch(
    entitySharedId: string,
    filteredConnectionIds: string[],
    filteredSharedIds: string[],
    limit: number
  ): Promise<SearchHub[]> {
    const rows = await this.getCollection()
      .aggregate([
        { $match: { entity: entitySharedId } },
        { $project: { hub: 1 } },
        {
          $lookup: {
            from: 'connections',
            localField: 'hub',
            foreignField: 'hub',
            as: 'connections',
          },
        },
        {
          $project: {
            hub: 1,
            connections: {
              $filter: {
                input: '$connections',
                as: 'conn',
                cond: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$$conn.entity', entitySharedId] },
                        ...(filteredConnectionIds.length
                          ? [
                              {
                                $in: [
                                  '$$conn._id',
                                  filteredConnectionIds.map(id =>
                                    MongoRelationshipsV1DataSource.toObjectId(id)
                                  ),
                                ],
                              },
                            ]
                          : [{ $in: ['$$conn.entity', filteredSharedIds] }]),
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        { $match: { 'connections.entity': { $in: filteredSharedIds } } },
        {
          $addFields: {
            sortValue: {
              $min: {
                $map: {
                  input: '$connections',
                  as: 'conn',
                  in: {
                    $cond: {
                      if: { $ne: ['$$conn.entity', entitySharedId] },
                      then: { $indexOfArray: [filteredSharedIds, '$$conn.entity'] },
                      else: 999999,
                    },
                  },
                },
              },
            },
          },
        },
        { $sort: { sortValue: 1 } },
        { $limit: limit },
      ])
      .toArray();

    return rows.map(row => ({
      hub: String(row.hub),
      connections: (row.connections as any[]).map(conn =>
        MongoRelationshipsV1DataSource.toV1Relationship(conn)
      ),
    }));
  }

  async getEntitiesAffectedByHubs(hubIds: string[]): Promise<string[]> {
    const rows = await this.getCollection()
      .aggregate([
        {
          $match: { hub: { $in: hubIds.map(id => MongoRelationshipsV1DataSource.toObjectId(id)) } },
        },
        { $group: { _id: '$entity' } },
      ])
      .toArray();

    return rows.map(row => String(row._id));
  }

  async getHubsToDelete(hubIds: string[]): Promise<string[]> {
    const rows = await this.getCollection()
      .aggregate([
        {
          $match: { hub: { $in: hubIds.map(id => MongoRelationshipsV1DataSource.toObjectId(id)) } },
        },
        { $group: { _id: '$hub', length: { $sum: 1 } } },
        { $match: { length: { $lt: 2 } } },
      ])
      .toArray();

    return rows.map(row => String(row._id));
  }

  private static toObjectId(value: unknown): ObjectId {
    if (value instanceof ObjectId) return value;
    return new ObjectId(String(value));
  }

  private static toStringId(value: unknown): string {
    return String(value);
  }

  private static toConditionValue(isObjectIdField: boolean, value: unknown): unknown {
    if (!isObjectIdField) return value;
    if (value === null) return null;
    return MongoRelationshipsV1DataSource.toObjectId(value);
  }

  private static toMongoQuery(query: RelationshipQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        MongoRelationshipsV1DataSource.applyMongoCondition(filter, key, value);
      }
    });
    return filter;
  }

  private static applyMongoCondition(
    filter: Record<string, unknown>,
    key: string,
    value: unknown
  ): void {
    if (key === 'template' && value === null) {
      filter.template = null;
      return;
    }
    if (Array.isArray(value)) {
      const isObjectIdField = OBJECT_ID_FIELDS.includes(key as (typeof OBJECT_ID_FIELDS)[number]);
      filter[key] = {
        $in: (value as unknown[]).map(v =>
          MongoRelationshipsV1DataSource.toConditionValue(isObjectIdField, v)
        ),
      };
      return;
    }
    if (OBJECT_ID_FIELDS.includes(key as (typeof OBJECT_ID_FIELDS)[number])) {
      filter[key] = MongoRelationshipsV1DataSource.toObjectId(value as string);
      return;
    }
    filter[key] = value;
  }

  private static toV1Relationship(doc: Record<string, unknown>): V1Relationship {
    const rest = { ...doc };
    delete rest.__v;
    return { ...rest, template: rest.template ?? null } as V1Relationship;
  }
}

export type { HubConnection };
