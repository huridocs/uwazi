import { ObjectId } from 'mongodb';

import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';

import { GetExistingInput, PXExtractionsDataSource } from '../domain/PXExtractionDataSource';
import { ExtractionStatus, PXExtraction } from '../domain/PXExtraction';
import { MongoPXExtractionDBO } from './MongoPXExtractionDBO';

export const mongoPXExtractionsCollection = 'px_extractions';

export class MongoPXExtractionsDataSource
  extends MongoDataSource<MongoPXExtractionDBO>
  implements PXExtractionsDataSource
{
  protected collectionName = mongoPXExtractionsCollection;

  async edit(extraction: PXExtraction): Promise<void> {
    const dbo: MongoPXExtractionDBO = {
      _id: new ObjectId(extraction.id),
      extractorId: new ObjectId(extraction.extractorId),
      sourceEntityId: extraction.sourceEntityId,
      userId: new ObjectId(extraction.userId),
      status: extraction.status,
      tenantName: extraction.tenantName,
    };

    await this.getCollection().updateOne({ _id: dbo._id }, { $set: dbo }, { upsert: false });
  }

  async save(extraction: PXExtraction): Promise<void> {
    const exists = await this.getCollection().findOne({ _id: new ObjectId(extraction.id) });

    if (exists) {
      await this.edit(extraction);
    } else {
      await this.create(extraction);
    }
  }

  async getExisting(input: GetExistingInput): Promise<PXExtraction | undefined> {
    const dbo: MongoPXExtractionDBO | undefined | null = await this.getCollection().findOne({
      extractorId: new ObjectId(input.extractorId),
      userId: new ObjectId(input.userId),
      sourceEntityId: input.entitySharedId,
      tenantName: input.tenantName,
    });

    if (!dbo) {
      return undefined;
    }

    return new PXExtraction({
      id: dbo._id.toString(),
      extractorId: dbo.extractorId.toString(),
      sourceEntityId: dbo.sourceEntityId.toString(),
      status: dbo.status as ExtractionStatus,
      tenantName: dbo.tenantName,
      userId: dbo.userId.toString(),
    });
  }

  async create(extraction: PXExtraction): Promise<void> {
    const dbo: MongoPXExtractionDBO = {
      _id: new ObjectId(extraction.id),
      extractorId: new ObjectId(extraction.extractorId),
      sourceEntityId: extraction.sourceEntityId,
      userId: new ObjectId(extraction.userId),
      status: extraction.status,
      tenantName: extraction.tenantName,
    };

    await this.getCollection().insertOne(dbo);
  }
}
