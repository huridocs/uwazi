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

    const paragraphsCreated = await this.entitiesDS.getAllLanguages(firstParagraphCreated.sharedId);

    // Todo: We have a save conflict here
    // If I update a specif entity language, the others one increase the version number ?
    // If this is true, then we need use a getById on each iteration of this reduce method.
    await paragraphsCreated.reduce(async (promise, paragraphCreated) => {
      await promise;

      const paragraphToSave = paragraphs.find(p => p.language === paragraphCreated.language);
      return this.entitiesDS.save(
        { ...paragraphCreated, ...paragraphToSave },
        {
          language: paragraphCreated.language,
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
