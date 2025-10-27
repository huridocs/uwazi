import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import entities from 'api/entities';
import { Db, ObjectId } from 'mongodb';

import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { PXExtractor } from '../domain/PXExtractor';
import {
  DeleteParagraphsInput,
  ExistsInput,
  PXExtractorsDataSource,
} from '../domain/PXExtractorDataSource';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXValidationError } from '../domain/PXValidationError';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { MongoPXDenormalizedExtractorDBO, MongoPXExtractorDBO } from './MongoPXExtractorDBO';

export const mongoPXExtractorsCollection = 'px_extractors';

export class MongoPXExtractorsDataSource
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsDataSource
{
  private extractorsQueryService: PXExtractorsQueryService;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    extractorsQueryService: PXExtractorsQueryService
  ) {
    super(db, transactionManager);
    this.extractorsQueryService = extractorsQueryService;
  }

  protected collectionName = mongoPXExtractorsCollection;

  async getBySourceTemplate(sourceTemplateId: string): Promise<PXExtractor | undefined> {
    const extractor = await this.getCollection()
      .find({
        sourceTemplateId: new ObjectId(sourceTemplateId),
      })
      .next();

    if (!extractor) {
      return undefined;
    }

    return this.getById(extractor._id.toString());
  }

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

  async exists(input: ExistsInput): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      { sourceTemplateId: new ObjectId(input.sourceTemplateId) },
      { limit: 1 }
    );

    return !!count;
  }

  async delete(extractorId: string): Promise<void> {
    const mongoExtractorId = new ObjectId(extractorId);

    const deleteResult = await this.getCollection().deleteOne({ _id: mongoExtractorId });

    if (deleteResult.deletedCount === 0) {
      throw new PXValidationError(
        PXValidationError.codes.CANNOT_DELETE_EXTRACTOR_THAT_DOES_NOT_EXIST,
        `Cannot delete an Extractor that does not exist. Id: ${extractorId}`
      );
    }

    await this.getCollection(mongoPXEntitiesStatusCollection).deleteMany({
      extractorId: mongoExtractorId,
    });
  }

  async deleteParagraphs({ entitySharedId, extractorId }: DeleteParagraphsInput): Promise<void> {
    const paragraphs = await this.extractorsQueryService
      .getEntityParagraphRelationships({
        extractorId,
        id: entitySharedId,
      })
      .all();

    await ArrayUtils.sequentialFor(paragraphs, async p => entities.delete(p.entitySharedId));
  }

  static toDomain(dbo: MongoPXDenormalizedExtractorDBO): PXExtractor {
    return new PXExtractor({
      id: dbo._id.toString(),
      sourceTemplate: MongoTemplateMapper.toDomain(dbo.sourceTemplate),
      targetTemplate: MongoTemplateMapper.toDomain(dbo.targetTemplate),
      paragraphNumberPropertyId: dbo.paragraphNumberPropertyId.toString(),
      paragraphPropertyId: dbo.paragraphPropertyId.toString(),
      sourceRelationshipTypeId: dbo.sourceRelationshipTypeId.toString(),
      targetRelationshipTypeId: dbo.targetRelationshipTypeId.toString(),
    });
  }
}
