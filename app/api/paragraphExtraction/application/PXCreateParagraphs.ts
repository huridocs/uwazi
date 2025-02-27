import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import entities from 'api/entities';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { GetParagraphsResultOutput } from '../domain/PXExtractionService';
import { PXCreateParagraph } from './PXCreateParagraph';
import { PXValidationError } from '../domain/PXValidationError';

type PXCreateParagraphsInput = GetParagraphsResultOutput;

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  createParagraph: PXCreateParagraph;

  constructor(private dependencies: Dependencies) {
    this.createParagraph = new PXCreateParagraph({
      logger: DefaultLogger(),
    });
  }

  async execute({ extractionId, paragraphs }: PXCreateParagraphsInput): Promise<Output> {
    const user = { _id: new ObjectId(extractionId.userId) };
    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(extractionId.extractorId),
      entities.getAllLanguages(extractionId.entitySharedId),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `The Extractor with id ${extractionId.extractorId} does not exist anymore`
      );
    }

    if (!sourceEntities.length) {
      throw new PXValidationError(
        PXValidationError.codes.SOURCE_ENTITY_DOES_NOT_EXIST_ANYMORE,
        `The source Entity for the Extractor ${extractor?.id} does not exist anymore`
      );
    }

    const promises = paragraphs.map(async paragraph =>
      this.createParagraph.execute({ paragraph, extractor, sourceEntities, user })
    );

    await Promise.all(promises);
  }
}

export type { PXCreateParagraphsInput };
