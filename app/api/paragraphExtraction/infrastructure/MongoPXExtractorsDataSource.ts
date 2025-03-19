import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { PXExtractor } from '../domain/PXExtractor';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { MongoPXDenormalizedExtractorDBO, MongoPXExtractorDBO } from './MongoPXExtractorDBO';

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
      ])
      .next();

    if (!extractor) return undefined;

    return MongoPXExtractorsDataSource.toDomain(extractor as MongoPXDenormalizedExtractorDBO);
  }

  async create(extractor: PXExtractor): Promise<void> {
    const mongoExtractor: MongoPXExtractorDBO = {
      _id: new ObjectId(extractor.id),
      sourceTemplateId: new ObjectId(extractor.sourceTemplate.id),
      targetTemplateId: new ObjectId(extractor.targetTemplate.id),
      paragraphNumberPropertyId: new ObjectId(extractor.paragraphNumberProperty.id),
      paragraphPropertyId: new ObjectId(extractor.paragraphProperty.id),
      sourceRelationshipTypeId: new ObjectId(extractor.sourceRelationshipTypeId),
      targetRelationshipTypeId: new ObjectId(extractor.targetRelationshipTypeId),
    };

    await this.getCollection().insertOne(mongoExtractor);
  }

  static toDomain(dbo: MongoPXDenormalizedExtractorDBO): PXExtractor {
    return new PXExtractor({
      id: dbo._id.toString(),
      sourceTemplate: TemplateMappers.toApp(dbo.sourceTemplate),
      targetTemplate: TemplateMappers.toApp(dbo.targetTemplate),
      paragraphNumberPropertyId: dbo.paragraphNumberPropertyId.toString(),
      paragraphPropertyId: dbo.paragraphPropertyId.toString(),
      sourceRelationshipTypeId: dbo.sourceRelationshipTypeId.toString(),
      targetRelationshipTypeId: dbo.targetRelationshipTypeId.toString(),
    });
  }
}
