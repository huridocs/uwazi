/* eslint-disable max-lines */
import { Db, ObjectId } from 'mongodb';

import { MongoDataSource, MongoDSOptions } from 'api/common.v2/database/MongoDataSource';
import { EntitySchema } from 'shared/types/entityType';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { LanguagesListSchema } from 'shared/types/commonTypes';

import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import {
  CreateForSourceEntitiesInput,
  CreateInput,
  GetExistingInput,
  MarkAsQueuedInput,
  PXEntitiesStatusDataSource,
} from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus, PXEntityStatusModel } from '../domain/PXEntityStatusModel';
import { MongoPXEntityStatusDBO } from './MongoPXEntityStatusDBO';

export const mongoPXEntitiesStatusCollection = 'px_entities_status';

export class MongoPXEntitiesStatusDataSource
  extends MongoDataSource<MongoPXEntityStatusDBO>
  implements PXEntitiesStatusDataSource
{
  protected collectionName = mongoPXEntitiesStatusCollection;

  constructor(
    db: Db,
    transaction: MongoTransactionManager,
    private settingsDS: SettingsDataSource,
    options?: MongoDSOptions
  ) {
    super(db, transaction, options);
  }

  private static filterDocumentsWithLanguageInstalled(installedLanguages: LanguagesListSchema) {
    return {
      $lookup: {
        from: 'files',
        let: { entitySharedId: '$sharedId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$entity', '$$entitySharedId'] },
                  { $in: ['$language', installedLanguages.map(l => l.ISO639_3)] },
                ],
              },
            },
          },
        ],
        as: 'files',
      },
    };
  }

  async createForSourceEntities({
    sourceTemplateId,
    extractorId,
  }: CreateForSourceEntitiesInput): Promise<void> {
    const installedLanguages = await this.settingsDS.getInstalledLanguages();
    const defaultLanguage = installedLanguages.find(l => l.default)?.key!;

    const sourceEntities = await this.getCollection<EntitySchema>('entities')
      .aggregate([
        {
          $match: {
            template: new ObjectId(sourceTemplateId),
            language: defaultLanguage,
          },
        },
        MongoPXEntitiesStatusDataSource.filterDocumentsWithLanguageInstalled(installedLanguages),
        {
          $match: {
            'files.0': { $exists: true },
          },
        },
        {
          $project: { sharedId: 1, _id: 0 },
        },
      ])
      .toArray();

    if (!sourceEntities.length) {
      return;
    }

    const entityStatuses: MongoPXEntityStatusDBO[] = sourceEntities.map(entity => ({
      _id: undefined as any,
      entitySharedId: entity.sharedId!,
      extractorId: new ObjectId(extractorId),
      status: EntityStatus.New,
    }));

    await this.getCollection().insertMany(entityStatuses, { session: this.getSession() });
  }

  async setAsError(extractionId: string): Promise<PXEntityStatusModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(extractionId) },
      { $set: { status: EntityStatus.Error } },
      { upsert: false, returnDocument: 'after' }
    );

    if (!dbo) {
      throw new Error(
        `Can not set an error of an Entity Status that does not exist. Id : ${extractionId}`
      );
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  async createAsNew(input: CreateInput): Promise<PXEntityStatusModel> {
    const dbo: MongoPXEntityStatusDBO = {
      _id: new ObjectId(),
      extractorId: new ObjectId(input.extractorId),
      entitySharedId: input.entitySharedId,

      status: EntityStatus.New,
    };

    await this.getCollection().insertOne(dbo);

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  async getById(extractionId: string): Promise<PXEntityStatusModel | undefined> {
    const dbo = await this.getCollection().findOne({
      _id: new ObjectId(extractionId),
    });

    if (!dbo) {
      return undefined;
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  static toDomain(dbo: MongoPXEntityStatusDBO): PXEntityStatusModel {
    return {
      id: dbo._id.toString(),
      extractorId: dbo.extractorId.toString(),
      entitySharedId: dbo.entitySharedId,
      status: dbo.status,
    };
  }

  async getExisting({
    extractorId,
    entitySharedId,
  }: GetExistingInput): Promise<PXEntityStatusModel | undefined> {
    const query: Record<string, any> = {};

    if (entitySharedId !== undefined) {
      query.entitySharedId = entitySharedId;
    }

    if (extractorId !== undefined) {
      query.extractorId = new ObjectId(extractorId);
    }

    const mongoEntityStatus = await this.getCollection().findOne(query);

    if (!mongoEntityStatus) {
      return undefined;
    }

    return MongoPXEntitiesStatusDataSource.toDomain(mongoEntityStatus);
  }

  async markAsObsolete(entityStatusId: string): Promise<void> {
    const currentStatus = await this.getCollection().findOne(
      { _id: new ObjectId(entityStatusId) },
      { projection: { status: 1 } }
    );

    if (currentStatus?.status === EntityStatus.New) {
      return;
    }

    await this.getCollection().updateOne(
      { _id: new ObjectId(entityStatusId) },
      { $set: { status: EntityStatus.Obsolete } },
      { upsert: false }
    );
  }

  async markAsProcessing(input: MarkAsQueuedInput): Promise<PXEntityStatusModel> {
    const mongoEntityStatus = await this.getCollection().findOneAndUpdate(
      {
        extractorId: new ObjectId(input.extractorId),
        entitySharedId: input.entitySharedId,
      },
      { $set: { status: EntityStatus.Processing } },
      { upsert: false, returnDocument: 'after' }
    );

    if (!mongoEntityStatus) {
      throw new Error(
        `Cannot change status to queued of a EntityStatus that does not exist. ${JSON.stringify(input)}`
      );
    }

    return MongoPXEntitiesStatusDataSource.toDomain(mongoEntityStatus);
  }

  async markAsFinished(entityStatusId: string): Promise<void> {
    await this.getCollection().updateOne(
      {
        _id: new ObjectId(entityStatusId),
      },
      { $set: { status: EntityStatus.Processed } },
      { upsert: false }
    );
  }

  async delete(entityStatusId: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(entityStatusId) });
  }

  async deleteBySourceEntity(entitySharedId: string): Promise<void> {
    await this.getCollection().deleteOne({ entitySharedId });
  }

  getAll(input: Partial<PXEntityStatusModel>): ResultSet<PXEntityStatusModel> {
    const query = {
      entitySharedId: input.entitySharedId,
      extractorId: input.extractorId && new ObjectId(input.extractorId),
      status: input.status,
    };

    const sanitized = Object.fromEntries(
      Object.entries(query).filter(([_, value]) => Boolean(value))
    );

    const cursor = this.getCollection().find(sanitized);

    return new MongoResultSet(cursor, MongoPXEntitiesStatusDataSource.toDomain.bind(this));
  }
}
