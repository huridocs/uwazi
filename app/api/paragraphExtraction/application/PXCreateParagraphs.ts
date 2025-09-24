import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Array.js' o... Remove this comment to see the full error message
import { ArrayUtils } from '../common.v2/utils/Array.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/index.js' or its c... Remove this comment to see the full error message
import entities from '../entities/index.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.js' or its co... Remove this comment to see the full error message
import relationshipsDS from '../relationships.js';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { PXCreateParagraph } from './PXCreateParagraph';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/errors/Operationa... Remove this comment to see the full error message
import { OperationalError } from '../common.v2/errors/OperationalError.js';

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
      logger: DefaultLogger(),
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

    // @ts-expect-error TS(7006): Parameter 'paragraph' implicitly has an 'any' type... Remove this comment to see the full error message
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
