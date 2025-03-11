import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { Logger } from 'api/log.v2/contracts/Logger';
import entities from 'api/entities';

import { PXExtractor } from '../domain/PXExtractor';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXExtractionsDataSource } from '../domain/PXExtractionDataSource';
import { PXExtractionModel } from '../domain/PXExtraction';

/**
 * Notes
 * 1. We need to save Paragraph number as a Property
 *  1.1 How to select the "correct" Property ? Maybe the user needs to select which one he wants to store that information
 *
 * 2. We need to know which "rich text" Property to store the extracted paragraph
 *  2.1 This can happen in the case where the target Template has more than one "rich text" Property
 *
 * 3. We need to inherit Properties from target Template
 */

type PXCreateParagraphInput = {
  sourceEntities: EntitySchema[];
  extractor: PXExtractor;
  user: { _id: ObjectId };
  paragraph: ParagraphOutput;
  extraction: PXExtractionModel;
};

type LegacyEntitiesDS = typeof entities;

type Output = any;

type Dependencies = {
  logger: Logger;
  extractionsDS: PXExtractionsDataSource;
  entitiesDS?: LegacyEntitiesDS;
};

class PXCreateParagraph implements UseCase<PXCreateParagraphInput, Output> {
  private dependencies: Required<Dependencies>;

  constructor(dependencies: Dependencies) {
    this.dependencies = { ...dependencies, entitiesDS: dependencies?.entitiesDS ?? entities };
  }

  async execute({
    paragraph,
    extractor,
    sourceEntities,
    user,
    extraction,
  }: PXCreateParagraphInput): Promise<Output> {
    try {
      const [first, ...paragraphs] = extractor.createParagraphs(sourceEntities, paragraph);

      const firstParagraphCreated = await this.dependencies.entitiesDS.save(first, {
        language: first.language,
        user,
      });

      await paragraphs.reduce(async (promise, paragraphTranslation) => {
        await promise;

        const existingTranslation = await this.dependencies.entitiesDS.getById(
          firstParagraphCreated.sharedId,
          paragraphTranslation.language
        );

        return this.dependencies.entitiesDS.save(
          { ...existingTranslation, ...paragraphTranslation },
          {
            language: paragraphTranslation.language,
            user,
          }
        );
      }, Promise.resolve());

      await this.dependencies.extractionsDS.incrementSuccess(extraction.id);

      this.dependencies.logger.info(
        `[PX] - Paragraph Created - ${JSON.stringify({
          entitySharedId: firstParagraphCreated.sharedId,
          title: firstParagraphCreated.title,
        })}`
      );
    } catch (e) {
      await this.dependencies.extractionsDS.incrementFail(extraction.id);
      throw e;
    }
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput, LegacyEntitiesDS };
