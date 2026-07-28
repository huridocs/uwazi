import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { upsertRelationshipTypeRequestSchema } from './RelationshipTypeRouteSchemas.js';

class CreateRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const dto = upsertRelationshipTypeRequestSchema.parse(this.request.body);

      const created = await CreateRelationshipTypeUseCaseFactory.default().execute({
        name: dto.name,
      });

      this.response.json(toDTO(created));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`Relationship type create failed: ${errorMessage}`, {
        namespace: 'RelationshipType_Create',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
        dto: JSON.stringify(this.request.body),
        tenantName: ExecutionContext.currentTenant.name,
        actorId: this.user._id,
        correlationId: ExecutionContext.correlationId,
      });

      throw error;
    }
  }
}

export { CreateRelationshipTypeController };
