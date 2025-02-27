import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { PXExtractor } from '../domain/PXExtractor';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';

export const mongoPXExtractorsCollection = 'px_extractors';

export class MongoPXExtractorsDataSource
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsDataSource
{
  protected collectionName = mongoPXExtractorsCollection;

  async getById(extractorId: string): Promise<PXExtractor | undefined> {
    const extractor = await this.getCollection()
      .aggregate([
        {
          $match: { _id: new ObjectId(extractorId) },
        },
        {
          $lookup: {
            from: 'templates',
            localField: 'sourceTemplateId',
            foreignField: '_id',
            as: 'sourceTemplate',
          },
        },
        {
          $lookup: {
            from: 'templates',
            localField: 'targetTemplateId',
            foreignField: '_id',
            as: 'targetTemplate',
          },
        },
        {
          $unwind: '$sourceTemplate',
        },
        {
          $unwind: '$targetTemplate',
        },
        {
          $project: {
            _id: 1,
            sourceTemplate: 1,
            targetTemplate: 1,
            paragraphNumberPropertyId: 1,
            paragraphPropertyId: 1,
          },
        },
      ])
      .next();

    if (!extractor) return undefined;

    return new PXExtractor({
      id: extractor._id,
      sourceTemplate: TemplateMappers.toApp(extractor.sourceTemplate),
      targetTemplate: TemplateMappers.toApp(extractor.targetTemplate),
      paragraphNumberPropertyId: extractor.paragraphNumberPropertyId.toString(),
      paragraphPropertyId: extractor.paragraphPropertyId.toString(),
    });
  }

  async create(extractor: PXExtractor): Promise<void> {
    const mongoExtractor: MongoPXExtractorDBO = {
      _id: new ObjectId(extractor.id),
      sourceTemplateId: new ObjectId(extractor.sourceTemplate.id),
      targetTemplateId: new ObjectId(extractor.targetTemplate.id),
      paragraphNumberPropertyId: new ObjectId(extractor.paragraphNumberProperty.id),
      paragraphPropertyId: new ObjectId(extractor.paragraphProperty.id),
    };

    await this.getCollection().insertOne(mongoExtractor);
  }
}
