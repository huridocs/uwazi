import { ObjectId } from 'mongodb';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { UseCase } from '#api/core/libs/UseCase.js';
import relationshipsDS from '#api/relationships/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { EntitySchema } from '#shared/types/entityType.js';

import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { ParagraphOutput } from '../domain/PXExtractionService.js';
import { PXExtractor } from '../domain/PXExtractor.js';

type PXCreateParagraphsBatchInput = {
  sourceEntity: Entity;
  extractor: PXExtractor;
  user: { _id: ObjectId };
  paragraphs: ParagraphOutput[];
};

type LegacyRelationshipsDS = typeof relationshipsDS;

type Output = any;

type Dependencies = {
  logger: Logger;
  entitiesStatusDS: PXEntitiesStatusDataSource;
  relationshipsDS: LegacyRelationshipsDS;
  entitiesService: EntitiesService;
  propertyAssignmentStrategy: PropertyAssignmentCreatorServiceStrategy;
  transactionManager: TransactionManager;
};

class PXCreateParagraphsBatch implements UseCase<PXCreateParagraphsBatchInput, Output> {
  private dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies;
  }

  async execute({
    paragraphs,
    extractor,
    sourceEntity,
    user,
  }: PXCreateParagraphsBatchInput): Promise<Output> {
    const targetLanguage = paragraphs[0].translations.find(t => t.isMainLanguage);
    const entities: any[] = [];
    const mainParagraphsData: Array<{ entity: any; mainParagraph: any }> = [];

    await ArrayUtils.sequentialFor(paragraphs, async paragraph => {
      const [mainParagraph, ...otherParagraphs] = extractor.createParagraphs(
        sourceEntity,
        paragraph
      );

      const entity = await this.dependencies.entitiesService.create({
        templateId: extractor.targetTemplate.id,
        userId: user._id.toString(),
      });

      const validParagraphs = [mainParagraph, ...otherParagraphs].filter(p =>
        entity.languages.includes(p.language)
      );

      await ArrayUtils.sequentialFor(validParagraphs, async paragraphData => {
        const propertyAssignments: PropertyAssignmentInput[] = [
          { name: 'title', value: [{ value: paragraphData.title! }] },
        ];

        if (paragraphData.metadata) {
          Object.entries(paragraphData.metadata).forEach(([name, value]) => {
            if (value) {
              propertyAssignments.push({ name, value });
            }
          });
        }

        const processedAssignments = await this.dependencies.propertyAssignmentStrategy.bulkCreate(
          propertyAssignments,
          entity.template,
          []
        );

        entity.setPropertyAssignments(processedAssignments, paragraphData.language);
      });

      entities.push(entity);
      mainParagraphsData.push({ entity, mainParagraph });
    });

    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.entitiesService.insert(entities, {
        tenantName: tenants.current().name,
        actorId: user._id.toString(),
        targetLanguage: targetLanguage!.language,
      });
    });

    await ArrayUtils.sequentialFor(mainParagraphsData, async ({ entity, mainParagraph }) => {
      const mainParagraphCreated: EntitySchema = {
        ...mainParagraph,
        sharedId: entity.sharedId,
      };

      await this.dependencies.relationshipsDS.save(
        [
          {
            entity: sourceEntity.sharedId,
            template: extractor.sourceRelationshipTypeId,
          },
          {
            entity: mainParagraphCreated.sharedId,
            template: extractor.targetRelationshipTypeId,
          },
        ],
        mainParagraphCreated.language
      );
    });

    this.dependencies.logger.info(
      `[PX] - Batch Created - ${entities.length} paragraph(s) for entity ${sourceEntity.sharedId}`
    );
  }
}

export { PXCreateParagraphsBatch };

export type { PXCreateParagraphsBatchInput };
