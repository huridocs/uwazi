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

  async save(extraction: PXExtraction): Promise<void> {
    const dbo: MongoPXExtractionDBO = {
      _id: new ObjectId(extraction.id),
      extractorId: new ObjectId(extraction.extractorId),
      sourceEntityId: extraction.sourceEntityId,
      status: extraction.status,
    };

    await this.getCollection().updateOne({ _id: dbo._id }, { $set: dbo }, { upsert: true });
  }

  async getExisting(input: GetExistingInput): Promise<PXExtraction | undefined> {
    const dbo: MongoPXExtractionDBO | undefined | null = await this.getCollection().findOne({
      extractorId: new ObjectId(input.extractorId),
      sourceEntityId: input.entitySharedId,
    });

    if (!dbo) {
      return undefined;
    }

    return new PXExtraction({
      id: dbo._id.toString(),
      extractorId: dbo.extractorId.toString(),
      sourceEntityId: dbo.sourceEntityId.toString(),
      status: dbo.status as ExtractionStatus,
    });
  }
}
