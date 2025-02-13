import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { LanguageISO6391 } from 'shared/types/commonTypes';

import { PXExtractionId } from '../domain/PXExtractionId';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';

type Input = {
  pageNumber: number;
  extractionId: string;
  text: string;
  language: LanguageISO6391;
};

type Output = any;

type Dependencies = {
  entityDS: EntitiesDataSource;
  extractorsDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
};

export class PXCreateParagraph implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const { extractor, sourceEntity } = await this.getInitialData(input);

    const title = PXCreateParagraph.createParagraphTitle(sourceEntity, input.pageNumber);
    const paragraph = new Entity(
      this.dependencies.idGenerator.generate(),
      'sharedId',
      input.language,
      title,
      extractor.targetTemplate.id,
      {}
    );
  }

  private async getInitialData(input: Input) {
    const extractionId = new PXExtractionId({ id: input.extractionId });
    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(extractionId.extractorId),
      this.dependencies.entityDS.getByIds([extractionId.entitySharedId], input.language).all(),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `Extractor with id "${extractionId.extractorId}" was not found`
      );
    }

    if (!sourceEntities[0]) {
      throw new PXValidationError(
        PXValidationError.codes.ENTITY_NOT_FOUND,
        `Source Entity with id "${extractionId.entitySharedId}" was not found`
      );
    }

    return { sourceEntity: sourceEntities[0], extractor };
  }

  private static createParagraphTitle(entity: Entity, pageNumber: number): string {
    return `${entity.title}.${pageNumber}`;
  }
}
