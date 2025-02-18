import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import entities from 'api/entities';

import { PXExtractor } from '../domain/PXExtractor';
import { ParagraphOutput } from '../domain/PXExtractionService';

type PXCreateParagraphInput = {
  mainLanguage: LanguageISO6391;
  sourceEntity: EntitySchema;
  extractor: PXExtractor;
  user: { _id: ObjectId };
  paragraph: ParagraphOutput;
};

type Output = any;

type Dependencies = {};

class PXCreateParagraph implements UseCase<PXCreateParagraphInput, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({
    paragraph,
    mainLanguage,
    extractor,
    sourceEntity,
    user,
  }: PXCreateParagraphInput): Promise<Output> {
    const [mainTranslation, ...translations] = paragraph.translations.sort(a =>
      a.language === mainLanguage ? -1 : 1
    );

    const [markdownProperty] = extractor.targetTemplate.getPropertiesByType('markdown');
    const entityResult = await entities.save(
      {
        title: PXCreateParagraph.createTitle(sourceEntity, paragraph.paragraphNumber),
        template: new ObjectId(extractor?.targetTemplate.id),
        metadata: {
          [markdownProperty.name]: [
            { value: mainTranslation?.text, label: markdownProperty.label },
          ],
        },
      },
      { language: mainTranslation.language, user }
    );

    const entitiesCreated = await entities.getAllLanguages(entityResult.sharedId);

    await translations.reduce(async (promise, translation) => {
      await promise;

      const entitySaved = entitiesCreated.find(e => e.language === translation.language);

      return entities.save(
        {
          ...entitySaved,
          metadata: {
            [markdownProperty.name]: [{ value: translation.text, label: markdownProperty.label }],
          },
        },
        { language: translation.language, user }
      );
    }, Promise.resolve());
  }

  private static createTitle(entity: EntitySchema, paragraphNumber: number): string {
    return `${entity.title}.${paragraphNumber}`;
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput };
