import { ObjectId } from 'mongodb';

import { UseCase } from '#api/common.v2/contracts/UseCase.js';

import { EntitySchema } from '#shared/types/entityType.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';

import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

import entities from '#api/entities/entities.js';

import relationshipsDS from '#api/relationships/index.js';

import { PXExtractor } from '#api/paragraphExtraction/domain/PXExtractor.js';
import { ParagraphOutput } from '#api/paragraphExtraction/domain/PXExtractionService.js';
import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';
import { PXEntityStatusModel } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';

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
