import { ObjectId } from 'mongodb';

import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';

import {
  CreateInput,
  PXEntitiesStatusDataSource,
  UpdateParagraphsCountInput,
} from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus, PXEntityStatusModel } from '../domain/PXEntityStatusModel';
import { MongoPXEntityStatus } from './MongoPXEntityStatus';

export const mongoPXEntitiesStatusCollection = 'px_entities_status';

export class MongoPXEntitiesStatusDataSource
  extends MongoDataSource<MongoPXEntityStatus>
  implements PXEntitiesStatusDataSource
{
  protected collectionName = mongoPXEntitiesStatusCollection;

  async updateParagraphsCount(input: UpdateParagraphsCountInput): Promise<PXEntityStatusModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(input.id) },
      { $set: { paragraphsCount: input.count } },
      { upsert: false, returnDocument: 'after' }
    );

    if (!dbo) {
      throw new Error(`Can not update an Entity Status that does not exist. Id : ${input.id}`);
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  private static computeStatus() {
    return {
      $cond: {
        if: {
          $lt: [
            { $add: ['$failedParagraphsCount', '$successfulParagraphsCount'] },
            '$paragraphsCount',
          ],
        },
        then: '$status',
        else: {
          $cond: {
            if: { $gte: ['$successfulParagraphsCount', 1] },
            then: EntityStatus.Finished,
            else: EntityStatus.Error,
          },
        },
      },
    };
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

  async incrementFail(extractionId: string): Promise<PXEntityStatusModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(extractionId) },
      [
        {
          $set: {
            failedParagraphsCount: { $add: ['$failedParagraphsCount', 1] },
          },
        },
        {
          $set: {
            status: MongoPXEntitiesStatusDataSource.computeStatus(),
          },
        },
      ],
      { upsert: false, returnDocument: 'after' }
    );

    if (!dbo) {
      throw new Error(
        `Can not increment failing paragraphs of an Entity Status that does not exist. Id : ${extractionId}`
      );
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  async incrementSuccess(extractionId: string): Promise<PXEntityStatusModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(extractionId) },
      [
        {
          $set: {
            successfulParagraphsCount: { $add: ['$successfulParagraphsCount', 1] },
          },
        },
        {
          $set: {
            status: MongoPXEntitiesStatusDataSource.computeStatus(),
          },
        },
      ],
      { upsert: false, returnDocument: 'after' }
    );

    if (!dbo) {
      throw new Error(
        `Can not increment successful paragraphs of an Entity Status that does not exist. Id : ${extractionId}`
      );
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  async initProcess(extractionId: string): Promise<PXEntityStatusModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(extractionId) },
      { $set: { status: EntityStatus.Processing } },
      { upsert: false, returnDocument: 'after' }
    );

    if (!dbo) {
      throw new Error(
        `Can not init processing of an Entity Status that does not exist. 
        id: ${extractionId}`
      );
    }

    return MongoPXEntitiesStatusDataSource.toDomain(dbo);
  }

  async create(input: CreateInput): Promise<PXEntityStatusModel> {
    const dbo: MongoPXEntityStatus = {
      _id: new ObjectId(),
      extractorId: new ObjectId(input.extractorId),
      entitySharedId: input.entitySharedId,

      status: EntityStatus.Queued,
      failedParagraphsCount: 0,
      paragraphsCount: 0,
      successfulParagraphsCount: 0,
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

  static toDomain(dbo: MongoPXEntityStatus): PXEntityStatusModel {
    return {
      id: dbo._id.toString(),
      extractorId: dbo.extractorId.toString(),
      entitySharedId: dbo.entitySharedId,

      status: dbo.status,
      paragraphsCount: dbo.paragraphsCount,
      failedParagraphsCount: dbo.failedParagraphsCount,
      successfulParagraphsCount: dbo.successfulParagraphsCount,
    };
  }
}
