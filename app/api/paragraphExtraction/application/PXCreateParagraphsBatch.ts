import { ObjectId } from 'mongodb';

import { ArrayUtils } from 'api/common.v2/utils/Array';
import { EntitiesService } from 'api/core/application/EntitiesService';
import { PropertyAssignmentInput } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { Logger } from 'api/core/libs/logger/contracts/Logger';
import { UseCase } from 'api/core/libs/UseCase';
import relationshipsDS from 'api/relationships';
import { tenants } from 'api/tenants/tenantContext';
import { EntitySchema } from 'shared/types/entityType';

import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXExtractor } from '../domain/PXExtractor';

type PXCreateParagraphsBatchInput = {
  sourceEntities: EntitySchema[];
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
    sourceEntities,
    user,
  }: PXCreateParagraphsBatchInput): Promise<Output> {
    const entities: any[] = [];
    const mainParagraphsData: Array<{ entity: any; mainParagraph: any }> = [];

    await ArrayUtils.sequentialFor(paragraphs, async paragraph => {
      const [mainParagraph, ...otherParagraphs] = extractor.createParagraphs(
        sourceEntities,
        paragraph
      );

      const entity = await this.dependencies.entitiesService.create({
        templateId: extractor.targetTemplate.id,
        userId: user._id.toString(),
      });

      const validParagraphs = [mainParagraph, ...otherParagraphs].filter(p =>
        entity.languages.includes(p.language as any)
      );

      await ArrayUtils.sequentialFor(validParagraphs, async paragraphData => {
        const propertyAssignments: PropertyAssignmentInput[] = [
          { name: 'title', value: [{ value: paragraphData.title! }] },
        ];

        if (paragraphData.metadata) {
          Object.entries(paragraphData.metadata).forEach(([name, value]) => {
            if (value) {
              propertyAssignments.push({ name, value: value as any });
            }
          });
        }

        const processedAssignments = await this.dependencies.propertyAssignmentStrategy.bulkCreate(
          propertyAssignments,
          entity.template,
          []
        );

        entity.setPropertyAssignments(processedAssignments, paragraphData.language as any, true);
      });

      entities.push(entity);
      mainParagraphsData.push({ entity, mainParagraph });
    });

    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.entitiesService.bulkInsert(entities, {
        tenantName: tenants.current().name,
        actorId: user._id.toString(),
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
    });

    this.dependencies.logger.info(
      `[PX] - Batch Created - ${entities.length} paragraph(s) for entity ${sourceEntities[0].sharedId}`
    );
  }
}

export { PXCreateParagraphsBatch };

export type { PXCreateParagraphsBatchInput };
