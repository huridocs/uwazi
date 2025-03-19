import { ObjectId } from 'mongodb';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { Logger } from 'api/log.v2/contracts/Logger';
import entities from 'api/entities';
import relationshipsDS from 'api/relationships';

import { PXExtractor } from '../domain/PXExtractor';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntityStatusModel } from '../domain/PXEntityStatusModel';

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
    entityStatus,
  }: PXCreateParagraphInput): Promise<Output> {
    try {
      const [mainParagraph, ...paragraphs] = extractor.createParagraphs(sourceEntities, paragraph);

      const mainParagraphCreated = await this.dependencies.entitiesDS.save(mainParagraph, {
        language: mainParagraph.language,
        user,
      });

      await ArrayUtils.sequentialFor(paragraphs, async paragraphTranslation => {
        const existingTranslation = await this.dependencies.entitiesDS.getById(
          mainParagraphCreated.sharedId,
          paragraphTranslation.language
        );

        await this.dependencies.entitiesDS.save(
          { ...existingTranslation, ...paragraphTranslation },
          {
            language: paragraphTranslation.language,
            user,
          }
        );
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

      await this.dependencies.entitiesStatusDS.incrementSuccess(entityStatus.id);

      this.dependencies.logger.info(
        `[PX] - Paragraph Created - ${JSON.stringify({
          entitySharedId: mainParagraphCreated.sharedId,
          title: mainParagraphCreated.title,
        })}`
      );
    } catch (e) {
      await this.dependencies.entitiesStatusDS.incrementFail(entityStatus.id);
      throw e;
    }
  }
}

export { PXCreateParagraph };

export type { PXCreateParagraphInput, LegacyEntitiesDS };
