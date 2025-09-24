import { Db, ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/Templ... Remove this comment to see the full error message
import { TemplateMappers } from 'api/templates.v2/database/TemplateMappers.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/index.js' or its c... Remove this comment to see the full error message
import entities from '../entities/index.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Array.js' o... Remove this comment to see the full error message
import { ArrayUtils } from '../common.v2/utils/Array.js';

import { PXExtractor } from '../domain/PXExtractor';
import {
  DeleteParagraphsInput,
  ExistsInput,
  PXExtractorsDataSource,
} from '../domain/PXExtractorDataSource';
import { MongoPXDenormalizedExtractorDBO, MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';

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
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    await this.getCollection().insertOne(mongoExtractor);
  }

  async exists(input: ExistsInput): Promise<boolean> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const count = await this.getCollection().countDocuments(
      { sourceTemplateId: new ObjectId(input.sourceTemplateId) },
      { limit: 1 }
    );

    return !!count;
  }

  async delete(extractorId: string): Promise<void> {
    const mongoExtractorId = new ObjectId(extractorId);

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const deleteResult = await this.getCollection().deleteOne({ _id: mongoExtractorId });

    if (deleteResult.deletedCount === 0) {
      throw new PXValidationError(
        PXValidationError.codes.CANNOT_DELETE_EXTRACTOR_THAT_DOES_NOT_EXIST,
        `Cannot delete an Extractor that does not exist. Id: ${extractorId}`
      );
    }

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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

    // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
    await ArrayUtils.sequentialFor(paragraphs, async p => entities.delete(p.entitySharedId));
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
