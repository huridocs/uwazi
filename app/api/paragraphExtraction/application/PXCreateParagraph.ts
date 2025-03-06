import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { Logger } from 'api/log.v2/contracts/Logger';
import entities from 'api/entities';

import { PXExtractor } from '../domain/PXExtractor';
import { ParagraphOutput } from '../domain/PXExtractionService';

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
};

type Output = any;

type Dependencies = {
  logger: Logger;
};

class PXCreateParagraph implements UseCase<PXCreateParagraphInput, Output> {
  entitiesDS = entities;

  constructor(private dependencies: Dependencies) {}

  async execute({
    paragraph,
    extractor,
    sourceEntities,
    user,
  }: PXCreateParagraphInput): Promise<Output> {
    const [first, ...paragraphs] = extractor.createParagraphs(sourceEntities, paragraph);

    const firstParagraphCreated = await this.entitiesDS.save(first, {
      language: first.language,
      user,
    });

    await paragraphs.reduce(async (promise, paragraphTranslation) => {
      await promise;

      const existingTranslation = await this.entitiesDS.getById(
        firstParagraphCreated.sharedId,
        paragraphTranslation.language
      );

      return this.entitiesDS.save(
        { ...existingTranslation, ...paragraphTranslation },
        {
          language: paragraphTranslation.language,
          user,
        }
      );
    }, Promise.resolve());

    this.dependencies.logger.info(
      `[PX] - Paragraph Created - ${JSON.stringify({
        entitySharedId: firstParagraphCreated.sharedId,
        title: firstParagraphCreated.title,
      })}`
    );
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput };
