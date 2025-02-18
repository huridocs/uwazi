import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import entities from 'api/entities';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { GetParagraphsResultOutput } from '../domain/PXExtractionService';
import { PXCreateParagraph } from './PXCreateParagraph';

type PXCreateParagraphsInput = GetParagraphsResultOutput;

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  idGenerator: IdGenerator;
};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  createParagraph: PXCreateParagraph;

  constructor(private dependencies: Dependencies) {
    this.createParagraph = new PXCreateParagraph({});
  }

  async execute({
    extractionId,
    mainLanguage,
    paragraphs,
  }: PXCreateParagraphsInput): Promise<Output> {
    const user = { _id: new ObjectId(extractionId.userId) };
    const [extractor, sourceEntity] = await Promise.all([
      this.dependencies.extractorsDS.getById(extractionId.extractorId),
      entities.getById(extractionId.entitySharedId, mainLanguage),
    ]);

    const promises = paragraphs.map(async paragraph =>
      this.createParagraph.execute({ paragraph, extractor, mainLanguage, sourceEntity, user })
    );

    await Promise.all(promises);
  }
}

export type { PXCreateParagraphsInput };
