import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { ParagraphOutput } from '../domain/PXExtractionService';

type PXCreateParagraphInput = ParagraphOutput;

type Output = any;

type Dependencies = {
  entitiesDS: EntitiesDataSource;
  extractorsDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
};

class PXCreateParagraph implements UseCase<PXCreateParagraphInput, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: PXCreateParagraphInput): Promise<Output> {
    const { extractor, sourceEntities, defaultParagraph, translationsParagraph } =
      await this.getInitialData(input);

    // await this.dependencies.entitiesDS.create();
  }

  private async getInitialData(input: PXCreateParagraphInput) {
    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(input.extractionId.extractorId),
      this.dependencies.entitiesDS.getByIds([input.extractionId.entitySharedId]).all(),
    ]);

    const translationsParagraph = input.translations.filter(
      item => item.language !== input.defaultLanguage
    );

    const defaultParagraph =
      input.translations.find(item => item.language === input.defaultLanguage) ||
      translationsParagraph.pop();

    if (!defaultParagraph) {
      throw new PXValidationError(
        PXValidationError.codes.DEFAULT_PARAGRAPH_NOT_FOUND,
        'A default Paragraph was not found'
      );
    }

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `Extractor with id "${input.extractionId.extractorId}" was not found`
      );
    }

    if (!sourceEntities.length) {
      throw new PXValidationError(
        PXValidationError.codes.ENTITY_NOT_FOUND,
        `Source Entity with id "${input.extractionId.entitySharedId}" was not found`
      );
    }

    return { sourceEntities, extractor, defaultParagraph, translationsParagraph };
  }

  private static createParagraphTitle(entity: Entity, pageNumber: number): string {
    return `${entity.title}.${pageNumber}`;
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput };
