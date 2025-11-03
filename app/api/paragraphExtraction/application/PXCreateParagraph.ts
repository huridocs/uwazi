import { ObjectId } from 'mongodb';

import { UseCase } from 'api/core/libs/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { Logger } from 'api/core/libs/logger/contracts/Logger';
import entities from 'api/entities';
import relationshipsDS from 'api/relationships';

import { PXExtractor } from '../domain/PXExtractor';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntityStatusModel } from '../domain/PXEntityStatusModel';

type PXCreateParagraphInput = {
  sourceEntities: EntitySchema[];
  extractor: PXExtractor;
  user: { _id: ObjectId };
  paragraph: ParagraphOutput;
  entityStatus: PXEntityStatusModel;
};

type LegacyEntitiesDS = typeof entities;

type LegacyRelationshipsDS = typeof relationshipsDS;

type Output = any;

type Dependencies = {
  logger: Logger;
  entitiesStatusDS: PXEntitiesStatusDataSource;
  entitiesDS?: LegacyEntitiesDS;
  relationshipsDS: LegacyRelationshipsDS;
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
  }: PXCreateParagraphInput): Promise<Output> {
    const [mainParagraph, ...paragraphs] = extractor.createParagraphs(sourceEntities, paragraph);

    const mainParagraphCreated = await this.dependencies.entitiesDS.save(mainParagraph, {
      language: mainParagraph.language,
      user,
    });

    await this.dependencies.relationshipsDS.save(
      [
        {
          entity: sourceEntities[0].sharedId,
          template: extractor.sourceRelationshipTypeId,
        },
        {
          entity: mainParagraphCreated.sharedId,
          template: extractor.targetRelationshipTypeId,
        },
      ],
      mainParagraphCreated.language
    );

    await ArrayUtils.sequentialFor(paragraphs, async paragraphTranslation => {
      const existingTranslation = await this.dependencies.entitiesDS.getById(
        mainParagraphCreated.sharedId,
        paragraphTranslation.language
      );

      if (
        existingTranslation?.title === paragraphTranslation.title &&
        existingTranslation?.metadata?.[extractor.paragraphProperty.name]?.[0].value ===
          paragraphTranslation?.metadata?.[extractor.paragraphProperty.name]?.[0].value
      ) {
        return;
      }

      await this.dependencies.entitiesDS.save(
        {
          ...existingTranslation,
          title: paragraphTranslation.title,
          metadata: {
            ...existingTranslation?.metadata,
            [extractor.paragraphProperty.name]:
              paragraphTranslation.metadata![extractor.paragraphProperty.name],
            [extractor.paragraphNumberProperty.name]:
              paragraphTranslation.metadata![extractor.paragraphNumberProperty.name],
          },
        },
        {
          language: paragraphTranslation.language,
          user,
        }
      );
    });

    this.dependencies.logger.info(
      `[PX] - Paragraph Created - ${JSON.stringify({
        entitySharedId: mainParagraphCreated.sharedId,
        title: mainParagraphCreated.title,
      })}`
    );
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput, LegacyEntitiesDS };
