import { ObjectId } from 'mongodb';

import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';

import {
  CreateInput,
  GetExistingInput,
  InitProcessInput,
  PXExtractionsDataSource,
  UpdateParagraphsCountInput,
} from '../domain/PXExtractionDataSource';
import { ExtractionStatus, PXExtraction, PXExtractionModel } from '../domain/PXExtraction';
import { MongoPXExtractionDBO } from './MongoPXExtractionDBO';

export const mongoPXExtractionsCollection = 'px_extractions';

export class MongoPXExtractionsDataSource
  extends MongoDataSource<MongoPXExtractionDBO>
  implements PXExtractionsDataSource
{
  protected collectionName = mongoPXExtractionsCollection;

  async updateParagraphsCount(input: UpdateParagraphsCountInput): Promise<PXExtractionModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(input.id) },
      { $set: { paragraphsCount: input.count } },
      { upsert: false, returnDocument: 'after' }
    );

    return MongoPXExtractionsDataSource.toDomain(dbo);
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
            then: ExtractionStatus.Finished,
            else: ExtractionStatus.Error,
          },
        },
      },
    };
  }

  async setAsError(extractionId: string): Promise<PXExtractionModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(extractionId) },
      { $set: { status: ExtractionStatus.Error } },
      { upsert: false, returnDocument: 'after' }
    );

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async incrementFail(extractionId: string): Promise<PXExtractionModel> {
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
            status: MongoPXExtractionsDataSource.computeStatus(),
          },
        },
      ],
      { upsert: false, returnDocument: 'after' }
    );

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async incrementSuccess(extractionId: string): Promise<PXExtractionModel> {
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
            status: MongoPXExtractionsDataSource.computeStatus(),
          },
        },
      ],
      { upsert: false, returnDocument: 'after' }
    );

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async initProcess(input: InitProcessInput): Promise<PXExtractionModel> {
    const dbo = await this.getCollection().findOneAndUpdate(
      { extractorId: new ObjectId(input.extractorId), entitySharedId: input.entitySharedId },
      { $set: { status: ExtractionStatus.Processing } },
      { upsert: false, returnDocument: 'after' }
    );

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async create(input: CreateInput): Promise<PXExtractionModel> {
    const dbo: MongoPXExtractionDBO = {
      _id: new ObjectId(),
      extractorId: new ObjectId(input.extractorId),
      entitySharedId: input.entitySharedId,

      status: ExtractionStatus.Queued,
      failedParagraphsCount: 0,
      paragraphsCount: 0,
      successfulParagraphsCount: 0,
    };

    await this.getCollection().insertOne(dbo);

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async getById(extractionId: string): Promise<PXExtractionModel | undefined> {
    const dbo = await this.getCollection().findOne({
      _id: new ObjectId(extractionId),
    });

    if (!dbo) {
      return undefined;
    }

    return MongoPXExtractionsDataSource.toDomain(dbo);
  }

  async save(extraction: PXExtraction): Promise<void> {
    const dbo: MongoPXExtractionDBO = {
      _id: new ObjectId(extraction.id),
      extractorId: new ObjectId(extraction.extractorId),
      entitySharedId: extraction.sourceEntityId,
      status: extraction.status,
    };

    await this.getCollection().updateOne({ _id: dbo._id }, { $set: dbo }, { upsert: true });
  }

  async getExisting(input: GetExistingInput): Promise<PXExtraction | undefined> {
    const dbo: MongoPXExtractionDBO | undefined | null = await this.getCollection().findOne({
      extractorId: new ObjectId(input.extractorId),
      entitySharedId: input.entitySharedId,
    });

    if (!dbo) {
      return undefined;
    }

    return new PXExtraction({
      id: dbo._id.toString(),
      extractorId: dbo.extractorId.toString(),
      sourceEntityId: dbo.entitySharedId.toString(),
      status: dbo.status as ExtractionStatus,
    });
  }

  static toDomain(dbo: MongoPXExtractionDBO): PXExtractionModel {
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
