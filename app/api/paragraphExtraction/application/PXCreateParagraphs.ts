import { ObjectId } from 'mongodb';

import { UseCase } from 'api/core/libs/UseCase';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import entities from 'api/entities';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import relationshipsDS from 'api/relationships';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { PXCreateParagraph } from './PXCreateParagraph';
import { OperationalError } from 'api/common.v2/errors/OperationalError';

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
