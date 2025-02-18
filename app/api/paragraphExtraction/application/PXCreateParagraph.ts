import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
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

  async execute(input: PXCreateParagraphInput): Promise<Output> {}

  private static createParagraphTitle(entity: Entity, pageNumber: number): string {
    return `${entity.title}.${pageNumber}`;
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput };
