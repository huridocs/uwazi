/* eslint-disable no-continue */
/* eslint-disable max-statements */
import { Db, ObjectId } from 'mongodb';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { LocalizedLabels } from '#shared/types/datavizSchema.js';
import { MongoDataSource, MongoDSOptions } from '../common/MongoDataSource.js';
import { FileDBO } from '../files/schemas/FilesTypes.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoFilesDAO } from '../files/MongoFilesDAO.js';
import { TimedMethod } from '#api/core/libs/logger/TimedMethodDecorator.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import {
  EntitiesDAO,
  EntityFilters,
  FindByLanguagePairsQuery,
  FindByMetadataCriteriaQuery,
  FindByTemplateIdRangeQuery,
  FindOptions,
  LabelInfo,
} from '#api/core/application/contracts/EntitiesDAO.js';
import type {
  EntityWithFiles,
  GetWithFilesMatch,
} from '#api/core/application/contracts/EntitiesDAO.js';

type EntityWithFilesInternal = EntityDBO & { documents: FileDBO[]; attachments: FileDBO[] };

class MongoEntitiesDAO extends MongoDataSource<EntityDBO> implements EntitiesDAO {
  protected collectionName = 'entities';

  private filesDAO?: MongoFilesDAO;

  private unrestrictedInstance?: EntitiesDAO;

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    options?: MongoDSOptions & { filesDAO?: MongoFilesDAO }
  ) {
    super(db, transactionManager, options);
    this.filesDAO = options?.filesDAO;
  }

  unrestricted(): EntitiesDAO {
    if (!this.unrestrictedInstance) {
      this.unrestrictedInstance = new MongoEntitiesDAO(this.db, this.transactionManager, {
        accessContext: AccessContext.system(),
      });
    }
    return this.unrestrictedInstance;
  }

  @TimedMethod('MongoEntitiesDAO.getWithFiles')
  async getWithFiles(match: GetWithFilesMatch): Promise<EntityWithFiles[]> {
    if (this.filesDAO) {
      return this.getWithFilesInMemory(match);
    }
    return this.getWithFilesAggregation(match).toArray();
  }

  async getByIdsWithDocuments(
    ids: string[],
    options: { limit?: number; documentsFullText?: boolean } = {}
  ): Promise<EntityWithFiles[]> {
    const validIds = ids.filter(id => ObjectId.isValid(id));
    if (validIds.length === 0) {
      return [];
    }

    const $match: Record<string, unknown> = {
      _id: { $in: validIds.map(id => new ObjectId(id)) },
    };

    const pipeline: Record<string, unknown>[] = [
      { $match },
      {
        $lookup: {
          from: 'files',
          localField: 'sharedId',
          foreignField: 'entity',
          as: 'files',
          pipeline: [
            {
              $project: options.documentsFullText ? { __v: 0 } : { fullText: 0, __v: 0 },
            },
          ],
        },
      },
      {
        $addFields: {
          documents: {
            $filter: {
              input: '$files',
              as: 'document',
              cond: { $eq: ['$$document.type', 'document'] },
            },
          },
          attachments: {
            $filter: {
              input: '$files',
              as: 'attachment',
              cond: { $eq: ['$$attachment.type', 'attachment'] },
            },
          },
        },
      },
      { $unset: 'files' },
    ];

    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }

    return this.getCollection().aggregate<EntityWithFilesInternal>(pipeline).toArray();
  }

  private getWithFilesAggregation(match: GetWithFilesMatch) {
    const $match = this.translateGetWithFilesMatch(match);

    return this.getCollection().aggregate<EntityWithFilesInternal>([
      {
        $match,
      },
      {
        $lookup: {
          from: 'files',
          localField: 'sharedId',
          foreignField: 'entity',
          as: 'files',

          pipeline: [
            {
              $project: { fullText: 0, __v: 0 },
            },
          ],
        },
      },

      {
        $addFields: {
          documents: {
            $filter: {
              input: '$files',
              as: 'document',
              cond: { $eq: ['$$document.type', 'document'] },
            },
          },
          attachments: {
            $filter: {
              input: '$files',
              as: 'attachment',
              cond: { $eq: ['$$attachment.type', 'attachment'] },
            },
          },
        },
      },

      {
        $unset: 'files',
      },
    ]);
  }

  private async getWithFilesInMemory(match: GetWithFilesMatch): Promise<EntityWithFiles[]> {
    const $match = this.translateGetWithFilesMatch(match);
    const entities = await this.getCollection().aggregate<EntityDBO>([{ $match }]).toArray();

    if (entities.length === 0) return [];

    const sharedIds = entities.map(e => e.sharedId);
    const allFiles = await this.filesDAO!.getByEntitySharedIds(sharedIds);

    const filesByEntity: Record<string, typeof allFiles> = {};
    for (const file of allFiles) {
      const entityId = file.entity;
      if (!entityId) continue;
      if (!filesByEntity[entityId]) filesByEntity[entityId] = [];
      filesByEntity[entityId].push(file);
    }

    return entities.map(entity => ({
      ...entity,
      documents: (filesByEntity[entity.sharedId] || []).filter(f => f.type === 'document'),
      attachments: (filesByEntity[entity.sharedId] || []).filter(f => f.type === 'attachment'),
    })) as unknown as EntityWithFiles[];
  }

  private translateGetWithFilesMatch(match: GetWithFilesMatch): Record<string, unknown> {
    const $match: Record<string, unknown> = {};
    if (match.sharedId) {
      $match.sharedId = match.sharedId;
    }
    if (match.sharedIds !== undefined) {
      $match.sharedId = { $in: match.sharedIds };
    }
    if (match.language) {
      $match.language = match.language;
    }
    if (match.published !== undefined) {
      $match.published = match.published;
    }
    return $match;
  }

  async getEntityIdsBySharedId(
    sharedIds: string[]
  ): Promise<{ _id: ObjectId; sharedId: string }[]> {
    return this.getCollection()
      .find({ sharedId: { $in: sharedIds } }, { projection: { _id: 1, sharedId: 1 } })
      .toArray();
  }

  async cloneForLanguage(
    from: LanguageISO6391,
    to: LanguageISO6391,
    onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;
    const collection = this.getCollection();
    const cursor = collection.find({ language: from });

    try {
      let batch: EntityDBO[] = [];

      // eslint-disable-next-line no-await-in-loop
      while (await cursor.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const doc = await cursor.next();
        if (doc) batch.push(doc);

        // eslint-disable-next-line no-await-in-loop
        if (batch.length >= BATCH_SIZE || !(await cursor.hasNext())) {
          if (batch.length > 0) {
            const clonedEntities = batch.map(({ _id: _discarded, ...rest }) => ({
              ...rest,
              language: to,
            }));
            // eslint-disable-next-line no-await-in-loop
            await collection.bulkWrite(
              clonedEntities.map(entity => ({
                updateOne: {
                  filter: { sharedId: entity.sharedId, language: to },
                  update: { $setOnInsert: entity },
                  upsert: true,
                },
              })),
              { ordered: false }
            );
            // eslint-disable-next-line no-await-in-loop
            if (onBatch) await onBatch(clonedEntities);
            batch = [];
          }
        }
      }
    } finally {
      await cursor.close();
    }
  }

  async getBySharedId(sharedId: string): Promise<EntityDBO[]>;
  async getBySharedId(sharedId: string, language: LanguageISO6391): Promise<EntityDBO | null>;
  async getBySharedId(
    sharedId: string,
    language?: LanguageISO6391
  ): Promise<EntityDBO[] | EntityDBO | null> {
    const filter: Record<string, unknown> = { sharedId };
    if (language) {
      filter.language = language;
      return this.getCollection().findOne(filter);
    }
    return this.getCollection().find(filter).toArray();
  }

  async getByInternalId(
    id: string,
    projection: Record<string, number> = {}
  ): Promise<EntityDBO | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return this.getCollection().findOne({ _id: new ObjectId(id) }, { projection });
  }

  async getTitleLabelsBySharedIds(
    sharedIds: string[],
    languages: LanguageISO6391[]
  ): Promise<Map<string, LocalizedLabels>> {
    const result = new Map<string, LocalizedLabels>();

    if (sharedIds.length === 0 || languages.length === 0) {
      return result;
    }

    const entities = await this.getCollection()
      .find(
        { sharedId: { $in: sharedIds }, language: { $in: languages } },
        { projection: { sharedId: 1, language: 1, title: 1 } }
      )
      .toArray();

    entities.forEach(entity => {
      if (!entity.sharedId || !entity.language) {
        return;
      }

      const labels = result.get(entity.sharedId) ?? {};
      labels[entity.language] = entity.title;
      result.set(entity.sharedId, labels);
    });

    return result;
  }

  async countDistinctSharedIds(): Promise<number> {
    const result = await this.getCollection()
      .aggregate<{ count: number }>([{ $group: { _id: '$sharedId' } }, { $count: 'count' }])
      .toArray();
    return result[0]?.count ?? 0;
  }

  async countByTemplate(templateId: string): Promise<number> {
    const result = await this.getCollection()
      .aggregate<{ count: number }>([
        { $match: { template: new ObjectId(templateId) } },
        { $group: { _id: '$sharedId' } },
        { $count: 'count' },
      ])
      .toArray();

    return result[0]?.count ?? 0;
  }

  async deleteByLanguage(
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;
    const collection = this.getCollection();
    const cursor = collection.find({ language }, { projection: { sharedId: 1 } });

    try {
      let batch: string[] = [];

      // eslint-disable-next-line no-await-in-loop
      while (await cursor.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const doc = await cursor.next();
        if (doc) batch.push(doc.sharedId);

        // eslint-disable-next-line no-await-in-loop
        if (batch.length >= BATCH_SIZE || !(await cursor.hasNext())) {
          if (batch.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            await collection.deleteMany({ sharedId: { $in: batch }, language });
            // eslint-disable-next-line no-await-in-loop
            if (onBatch) await onBatch(batch);
            batch = [];
          }
        }
      }
    } finally {
      await cursor.close();
    }
  }

  // ── Generic reads (contract) ──────────────────────────────────────────────

  async find(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO[]> {
    return this.executeFind(this.translateFilters(filters), options);
  }

  async findOne(filters: EntityFilters = {}, options: FindOptions = {}): Promise<EntityDBO | null> {
    const query = this.translateFilters(filters);
    const projection =
      options.select && options.select.length > 0
        ? Object.fromEntries(options.select.map(s => [s, 1]))
        : undefined;

    return this.getCollection().findOne(query, projection ? { projection } : undefined);
  }

  async count(filters: EntityFilters = {}): Promise<number> {
    return this.getCollection().countDocuments(this.translateFilters(filters));
  }

  async getIds(filters: EntityFilters = {}): Promise<string[]> {
    const docs = await this.getCollection()
      .find(this.translateFilters(filters), { projection: { _id: 1 } })
      .toArray();
    return docs.map(doc => doc._id.toHexString());
  }

  async getSharedIdLabelInfo(sharedIds: string[], language: string): Promise<LabelInfo[]> {
    if (sharedIds.length === 0) {
      return [];
    }

    const docs = await this.getCollection()
      .find(
        { sharedId: { $in: sharedIds }, language },
        { projection: { sharedId: 1, title: 1, icon: 1 } }
      )
      .toArray();

    return docs.map(doc => ({
      sharedId: doc.sharedId,
      title: doc.title,
      icon: doc.icon,
    }));
  }

  // ── Named query shapes (contract) ─────────────────────────────────────────

  async findByLanguagePairs(
    query: FindByLanguagePairsQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    if (query.pairs.length === 0) {
      return [];
    }
    return this.executeFind(
      {
        $or: query.pairs.map(pair => ({
          sharedId: pair.sharedId,
          language: pair.language,
        })),
      },
      options
    );
  }

  async findByTemplateIdRange(
    query: FindByTemplateIdRangeQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    const conditions: Record<string, unknown>[] = [{ template: new ObjectId(query.templateId) }];

    const range: Record<string, unknown> = {};
    if (query.from && ObjectId.isValid(query.from)) {
      range.$gte = new ObjectId(query.from);
    }
    if (query.to && ObjectId.isValid(query.to)) {
      range.$lte = new ObjectId(query.to);
    }
    if (Object.keys(range).length > 0) {
      conditions.push({ _id: range });
    }

    if (query.language) {
      conditions.push({ language: query.language });
    }

    return this.executeFind(
      conditions.length === 1 ? conditions[0] : { $and: conditions },
      options
    );
  }

  async findByMetadataCriteria(
    query: FindByMetadataCriteriaQuery,
    options: FindOptions = {}
  ): Promise<EntityDBO[]> {
    const conditions: Record<string, unknown>[] = query.criteria.map(criteria => {
      const path = `metadata.${criteria.property}`;
      const condition: Record<string, unknown> = {};
      if (criteria.exists) {
        condition.$exists = true;
      }
      if (criteria.nonEmpty) {
        condition.$exists = true;
        condition.$ne = [];
      }
      if (criteria.hasValues) {
        condition.$elemMatch = { value: { $exists: true, $nin: ['', null] } };
      }
      return { [path]: condition };
    });

    conditions.push(...this.translateFilterConditions(query.filters ?? {}));

    return this.executeFind(
      conditions.length === 1 ? conditions[0] : { $and: conditions },
      options
    );
  }

  private async executeFind(
    query: Record<string, unknown>,
    options: FindOptions
  ): Promise<EntityDBO[]> {
    let cursor = this.getCollection().find(query);

    if (options.select && options.select.length > 0) {
      cursor = cursor.project(Object.fromEntries(options.select.map(s => [s, 1])));
    }

    if (options.sort && options.sort.length > 0) {
      const sort: Record<string, 1 | -1> = {};
      options.sort.forEach(s => {
        sort[s.field] = s.direction === 'asc' ? 1 : -1;
      });
      cursor = cursor.sort(sort);
    }

    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }

    return cursor.toArray();
  }

  private translateFilters(filters: EntityFilters): Record<string, unknown> {
    const conditions = this.translateFilterConditions(filters);

    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { $and: conditions };
  }

  private translateFilterConditions(filters: EntityFilters): Record<string, unknown>[] {
    const conditions: Record<string, unknown>[] = [];

    if (filters._id) {
      if (ObjectId.isValid(filters._id)) {
        conditions.push({ _id: new ObjectId(filters._id) });
      }
    }

    if (filters.ids !== undefined) {
      const validIds = filters.ids.filter(id => ObjectId.isValid(id));
      conditions.push({ _id: { $in: validIds.map(id => new ObjectId(id)) } });
    }

    if (filters.sharedId) {
      conditions.push({ sharedId: filters.sharedId });
    }

    if (filters.sharedIds !== undefined) {
      conditions.push({ sharedId: { $in: filters.sharedIds } });
    }

    if (filters.language) {
      conditions.push({ language: filters.language });
    }

    if (filters.languages !== undefined) {
      conditions.push({ language: { $in: filters.languages } });
    }

    if (filters.template) {
      conditions.push({ template: new ObjectId(filters.template) });
    }

    if (filters.templateIds !== undefined) {
      conditions.push({ template: { $in: filters.templateIds.map(id => new ObjectId(id)) } });
    }

    if (filters.title) {
      conditions.push({ title: filters.title });
    }

    if (filters.titleNotEmpty) {
      conditions.push({ title: { $ne: '' } });
    }

    if (filters.published !== undefined) {
      conditions.push({ published: filters.published });
    }

    if (filters.metadataValueIn !== undefined) {
      if (filters.metadataValueIn.length === 0) {
        // An empty OR list must match nothing, not everything.
        conditions.push({ _id: { $in: [] } });
      } else {
        conditions.push({
          $or: filters.metadataValueIn.map(({ property, value }) => ({
            [`metadata.${property}`]: { $elemMatch: { value } },
          })),
        });
      }
    }

    return conditions;
  }
}

export { MongoEntitiesDAO };
export type { EntityWithFilesInternal };
export type { EntityWithFiles } from '#api/core/application/contracts/EntitiesDAO.js';
