/* eslint-disable max-lines */
import { Db, MongoServerError, ObjectId } from 'mongodb';

import { MongoDataSource, MongoDSOptions } from 'api/common.v2/database/MongoDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';

import { ResultSet } from 'api/core/libs/ResultSet';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { OperationalError } from 'api/common.v2/errors/OperationalError';
import {
  CreateInput,
  GetExistingInput,
  PXEntitiesStatusDataSource,
} from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus, PXEntityStatusModel } from '../domain/PXEntityStatusModel';
import { MongoPXEntityStatusDBO } from './MongoPXEntityStatusDBO';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXValidationError } from '../domain/PXValidationError';

export const mongoPXEntitiesStatusCollection = 'px_entities_status';

export class MongoPXEntitiesStatusDataSource
  extends MongoDataSource<MongoPXEntityStatusDBO>
  implements PXEntitiesStatusDataSource
{
  protected collectionName = mongoPXEntitiesStatusCollection;

  // eslint-disable-next-line max-params
  constructor(
    db: Db,
    transaction: MongoTransactionManager,
    private settingsDS: SettingsDataSource,
    private extractorsQueryService: PXExtractorsQueryService,
    options?: MongoDSOptions
  ) {
    super(db, transaction, options);
  }

  async createWithStatus(input: CreateInput): Promise<PXEntityStatusModel> {
    try {
      const dbo: MongoPXEntityStatusDBO = {
        _id: new ObjectId(),
        extractorId: new ObjectId(input.extractorId),
        entitySharedId: input.entitySharedId,
        status: input.status,
      };

      await this.getCollection().insertOne(dbo, { session: this.getSession() });

      return MongoPXEntitiesStatusDataSource.toDomain(dbo);
    } catch (e) {
      if (
        e instanceof MongoServerError &&
        e.errorResponse.errmsg?.includes('duplicate key error collection')
      ) {
        throw new PXValidationError(
          PXValidationError.codes.CANNOT_CREATE_ENTITY_STATUS,
          'Cannot create an EntityStatus with duplicated extractorId and entitySharedId in this collection'
        );
      }

      throw e;
    }
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

  async markAsError(extractionId: string): Promise<void> {
    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(extractionId) },
      { $set: { status: EntityStatus.Error } },
      { upsert: false }
    );

    if (!result.modifiedCount) {
      throw new OperationalError(
        `Can not change the status to '${EntityStatus.Error}' of an EntityStatus that does not exist. Id : ${extractionId}`
      );
    }
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
      {
        $set: {
          status:
            currentStatus?.status === EntityStatus.Processing
              ? EntityStatus.ProcessingObsolete
              : EntityStatus.Obsolete,
        },
      },
      { upsert: false }
    );
  }

  async markAsProcessing(entityStatusId: string): Promise<void> {
    const mongoEntityStatus = await this.getCollection().updateOne(
      {
        _id: new ObjectId(entityStatusId),
      },
      { $set: { status: EntityStatus.Processing } },
      { upsert: false }
    );

    if (!mongoEntityStatus.modifiedCount) {
      throw new OperationalError(
        `Cannot change status to '${EntityStatus.Processing}' of a EntityStatus that does not exist. entityStatusId: ${entityStatusId}`
      );
    }
  }

  async markAsProcessed(entityStatusId: string): Promise<void> {
    const currentStatus = await this.getCollection().findOne(
      { _id: new ObjectId(entityStatusId) },
      { projection: { status: 1 } }
    );

    const newStatus =
      currentStatus?.status === EntityStatus.ProcessingObsolete
        ? EntityStatus.Obsolete
        : EntityStatus.Processed;

    await this.getCollection().updateOne(
      {
        _id: new ObjectId(entityStatusId),
      },
      { $set: { status: newStatus } },
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
