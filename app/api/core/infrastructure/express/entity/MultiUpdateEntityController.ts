import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { MultiUpdateEntity } from '#api/core/application/MultiUpdateEntity.js';
import { MultiUpdateEntityUseCaseFactory } from '../../factories/MultiUpdateEntityUseCaseFactory.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';

type RequestDto = {
  ids: string[];
  values: {
    metadata?: Record<string, unknown[]>;
    template?: string;
  };
};

class MultiUpdateEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();

    try {
      const useCase = MultiUpdateEntityUseCaseFactory.default();

      const parsed = MultiUpdateEntity.InputSchema.parse({ ids: this.request.body?.ids || [] });
      const { values = {} } = this.request.body;
      const targetLanguage = this.language;

      const propertyAssignments: PropertyAssignmentInput[] | undefined = values.metadata
        ? (Object.entries(values.metadata).map(([name, value]) => ({
            name,
            value,
          })) as PropertyAssignmentInput[])
        : undefined;

      const output = await useCase.execute({
        ids: parsed.ids,
        targetLanguage,
        values: {
          propertyAssignments,
          templateId: values.template?.toString(),
        },
      });

      const sharedIds = [...new Set(output.map(e => e.sharedId))];

      const entityDAO = new MongoEntityDAO(
        getConnection(),
        DependenciesContext.transactionManager as MongoTransactionManager,
        this.user
      );

      const updatedEntities = await Promise.all(
        sharedIds.map(async sharedId =>
          entityDAO.getWithFiles({ sharedId, language: targetLanguage }).next()
        )
      );

      DependenciesContext.logger.info('MultiUpdateEntity executed successfully', {
        namespace: 'MultiUpdate_Entity',
        success: true,
        durationMs: Date.now() - startTime,
        count: updatedEntities.length,
      });

      this.response.json(updatedEntities);
    } catch (error: unknown) {
      DependenciesContext.logger.info(
        `MultiUpdateEntity failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'MultiUpdate_Entity',
          success: false,
          durationMs: Date.now() - startTime,
          error: JSON.stringify(error),
          dto: JSON.stringify(this.request.body),
        }
      );

      throw error;
    }
  }
}

export { MultiUpdateEntityController };
