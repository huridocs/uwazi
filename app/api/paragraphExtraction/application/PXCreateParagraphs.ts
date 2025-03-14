import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import entities from 'api/entities';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { GetParagraphsResultOutput } from '../domain/PXExtractionService';
import { PXCreateParagraph } from './PXCreateParagraph';
import { PXValidationError } from '../domain/PXValidationError';
import { PXExtractionsDataSource } from '../domain/PXExtractionDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';

type PXCreateParagraphsInput = GetParagraphsResultOutput;

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  extractionsDS: PXExtractionsDataSource;
};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  createParagraph: PXCreateParagraph;

  constructor(private dependencies: Dependencies) {
    this.createParagraph = new PXCreateParagraph({
      logger: DefaultLogger(),
      extractionsDS: this.dependencies.extractionsDS,
    });
  }

  // eslint-disable-next-line max-statements
  async execute({ extractionKey, paragraphs }: PXCreateParagraphsInput): Promise<Output> {
    await this.dependencies.extractionsDS.updateParagraphsCount({
      id: extractionKey.extractionId,
      count: paragraphs.length,
    });
    const user = { _id: new ObjectId(extractionKey.userId) };
    const extraction = await this.dependencies.extractionsDS.getById(extractionKey.extractionId);
    if (!extraction) {
      throw new Error('Extraction not found');
    }

    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(extraction.extractorId),
      entities.getAllLanguages(extraction.entitySharedId),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `The Extractor with id ${extraction.extractorId} does not exist anymore`
      );
    }

    if (!sourceEntities.length) {
      throw new PXValidationError(
        PXValidationError.codes.SOURCE_ENTITY_DOES_NOT_EXIST_ANYMORE,
        `The source Entity for the Extractor ${extractor?.id} does not exist anymore`
      );
    }

    await ArrayUtils.parallelFor(paragraphs, async paragraph =>
      this.createParagraph.execute({ paragraph, extractor, sourceEntities, user, extraction })
    );
  }
}

export type { PXCreateParagraphsInput };
