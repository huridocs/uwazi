import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Db, ObjectId } from 'mongodb';

import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { TemplateRow } from '#api/core/infrastructure/postgresql/template/PostgresTemplateMapper.js';
import { PXExtractor } from '../domain/PXExtractor.js';
import {
  ExistsInput,
  GetParagraphsIdsInput,
  PXExtractorsDataSource,
} from '../domain/PXExtractorDataSource.js';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService.js';
import { PXValidationError } from '../domain/PXValidationError.js';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource.js';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

// Temporary union type during Mongo -> Postgres migration
type TemplatesDAO = Awaited<ReturnType<typeof TemplatesDAOFactory.default>>;

export const mongoPXExtractorsCollection = 'px_extractors';

export class MongoPXExtractorsDataSource
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsDataSource
{
  private extractorsQueryService: PXExtractorsQueryService;

  private templatesDAO: TemplatesDAO;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    extractorsQueryService: PXExtractorsQueryService,
    templatesDAO: TemplatesDAO
  ) {
    super(db, transactionManager);
    this.extractorsQueryService = extractorsQueryService;
    this.templatesDAO = templatesDAO;
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
    const extractor = await this.getCollection().findOne({
      _id: new ObjectId(extractorId),
    });

    if (!extractor) return undefined;

    const templateIds = [extractor.sourceTemplateId, extractor.targetTemplateId].map(id =>
      id.toString()
    );
    const templateDBOs = await this.templatesDAO.get(templateIds);
    const templateMap = new Map(templateDBOs.map(t => [t._id.toString(), t]));

    const sourceTemplate = templateMap.get(extractor.sourceTemplateId.toString());
    const targetTemplate = templateMap.get(extractor.targetTemplateId.toString());

    if (!sourceTemplate || !targetTemplate) return undefined;

    return MongoPXExtractorsDataSource.toDomain(extractor, sourceTemplate, targetTemplate);
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

  async getParagraphsIds({
    entitySharedId,
    extractorId,
  }: GetParagraphsIdsInput): Promise<string[]> {
    const paragraphs = await this.extractorsQueryService
      .getEntityParagraphRelationships({
        extractorId,
        id: entitySharedId,
      })
      .all();

    return paragraphs.map(p => p.entitySharedId);
  }

  static toDomain(
    dbo: MongoPXExtractorDBO,
    sourceTemplate: TemplateDBO | TemplateRow,
    targetTemplate: TemplateDBO | TemplateRow
  ): PXExtractor {
    return new PXExtractor({
      id: dbo._id.toString(),
      sourceTemplate: MongoTemplateMapper.toDomain({
        ...sourceTemplate,
        _id: new ObjectId(sourceTemplate._id),
      }),
      targetTemplate: MongoTemplateMapper.toDomain({
        ...targetTemplate,
        _id: new ObjectId(targetTemplate._id),
      }),
      paragraphNumberPropertyId: dbo.paragraphNumberPropertyId.toString(),
      paragraphPropertyId: dbo.paragraphPropertyId.toString(),
      sourceRelationshipTypeId: dbo.sourceRelationshipTypeId.toString(),
      targetRelationshipTypeId: dbo.targetRelationshipTypeId.toString(),
    });
  }
}
