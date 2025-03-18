import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import entities from 'api/entities';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import relationshipsDS from 'api/relationships';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { GetParagraphsResultOutput } from '../domain/PXExtractionService';
import { PXCreateParagraph } from './PXCreateParagraph';
import { PXValidationError } from '../domain/PXValidationError';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';

type PXCreateParagraphsInput = GetParagraphsResultOutput;

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

  // eslint-disable-next-line max-statements
  async execute({ extractionKey, paragraphs }: PXCreateParagraphsInput): Promise<Output> {
    await this.dependencies.entitiesStatusDS.updateParagraphsCount({
      id: extractionKey.extractionId,
      count: paragraphs.length,
    });
    const user = { _id: new ObjectId(extractionKey.userId) };
    const entityStatus = await this.dependencies.entitiesStatusDS.getById(
      extractionKey.extractionId
    );
    if (!entityStatus) {
      throw new Error('Entity Status not found');
    }

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

    await ArrayUtils.parallelFor(paragraphs, async paragraph =>
      this.createParagraph.execute({ paragraph, extractor, sourceEntities, user, entityStatus })
    );
  }
}

export type { PXCreateParagraphsInput };
