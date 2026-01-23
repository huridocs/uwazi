import { ObjectId } from 'mongodb';

import { UseCase } from '#api/common.v2/contracts/UseCase.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';

import entities from '#api/entities/entities.js';

import relationshipsDS from '#api/relationships/index.js';

import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';
import { ParagraphOutput } from '#api/paragraphExtraction/domain/PXExtractionService.js';
import { PXExtractorsDataSource } from '#api/paragraphExtraction/domain/PXExtractorDataSource.js';
import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { PXCreateParagraph } from '#api/paragraphExtraction/application/PXCreateParagraph.js';

import { OperationalError } from '#api/common.v2/errors/OperationalError.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

type PXCreateParagraphsInput = {
  userId: string;
  entityStatusId: string;
  paragraphs: ParagraphOutput[];
  onParagraphCreated?: () => Promise<void>;
};

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  entitiesStatusDS: PXEntitiesStatusDataSource;
};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  createParagraph: PXCreateParagraph;

  constructor(private dependencies: Dependencies) {
    this.createParagraph = new PXCreateParagraph({
      logger: LoggerFactory.default(),
      entitiesStatusDS: this.dependencies.entitiesStatusDS,
      relationshipsDS,
    });
  }

  async execute({
    entityStatusId,
    paragraphs,
    userId,
    onParagraphCreated,
  }: PXCreateParagraphsInput): Promise<Output> {
    const user = { _id: new ObjectId(userId) };
    const entityStatus = await this.getEntityStatus(entityStatusId);

    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(entityStatus.extractorId),
      entities.getAllLanguages(entityStatus.entitySharedId),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `The Extractor with id ${entityStatus.extractorId} does not exist anymore`
      );
    }

    if (!sourceEntities.length) {
      throw new PXValidationError(
        PXValidationError.codes.SOURCE_ENTITY_DOES_NOT_EXIST_ANYMORE,
        `The source Entity for the Extractor ${extractor?.id} does not exist anymore`
      );
    }

    await ArrayUtils.sequentialFor(paragraphs, async paragraph => {
      await this.createParagraph.execute({
        paragraph,
        extractor,
        sourceEntities,
        user,
        entityStatus,
      });
      if (onParagraphCreated) {
        await onParagraphCreated();
      }
    });

    await this.dependencies.entitiesStatusDS.markAsProcessed(entityStatusId);
  }

  private async getEntityStatus(entityStatusId: string) {
    const entityStatus = await this.dependencies.entitiesStatusDS.getById(entityStatusId);
    if (!entityStatus) {
      throw new OperationalError('Entity Status not found');
    }
    return entityStatus;
  }
}

export type { PXCreateParagraphsInput };
