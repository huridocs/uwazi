import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/DeleteRelationshipTypeUseCaseFactory.js';
import { deleteRelationshipTypeQuerySchema } from './RelationshipTypeRouteSchemas.js';

class DeleteRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const parsed = deleteRelationshipTypeQuerySchema.parse(this.request.query);
      const response = await DeleteRelationshipTypeUseCaseFactory.default().execute({
        id: parsed._id,
      });

      this.response.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`Relationship type delete failed: ${errorMessage}`, {
        namespace: 'RelationshipType_Delete',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
        query: JSON.stringify(this.request.query),
        tenantName: ExecutionContext.currentTenant.name,
        actorId: this.user._id,
        correlationId: ExecutionContext.correlationId,
      });

      throw error;
    }
  }
}

export { DeleteRelationshipTypeController };
