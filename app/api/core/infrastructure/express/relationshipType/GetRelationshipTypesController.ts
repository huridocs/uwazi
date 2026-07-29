import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { getRelationshipTypesQuerySchema } from './RelationshipTypeRouteSchemas.js';

class GetRelationshipTypesController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const parsed = getRelationshipTypesQuerySchema.parse(this.request.query);
      const response = await GetRelationshipTypesUseCaseFactory.default().execute({
        id: parsed._id,
      });

      this.response.json({ rows: response.map(toDTO) });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`Relationship types fetch failed: ${errorMessage}`, {
        namespace: 'RelationshipType_Get',
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

export { GetRelationshipTypesController };
