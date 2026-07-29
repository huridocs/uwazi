import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/UpdateRelationshipTypeUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { upsertRelationshipTypeRequestSchema } from './RelationshipTypeRouteSchemas.js';

class UpdateRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const dto = upsertRelationshipTypeRequestSchema.parse(this.request.body);

      if (!dto._id) {
        throw new Error('Relationship type _id is required for update');
      }

      const updated = await UpdateRelationshipTypeUseCaseFactory.default().execute({
        id: dto._id,
        name: dto.name,
      });

      this.response.json(toDTO(updated));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`Relationship type update failed: ${errorMessage}`, {
        namespace: 'RelationshipType_Update',
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

export { UpdateRelationshipTypeController };
