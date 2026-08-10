import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteUserGroupsUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUserGroupsUseCaseFactory.js';

const DeleteUserGroupsQuerySchema = z.object({
  ids: z
    .union([z.string(), z.array(z.string())])
    .transform(value => (Array.isArray(value) ? value : [value])),
});

class DeleteUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const parsed = DeleteUserGroupsQuerySchema.parse(this.request.query);

      const response = await DeleteUserGroupsUseCaseFactory.default().execute({
        ids: parsed.ids,
      });

      this.response.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`User groups delete failed: ${errorMessage}`, {
        namespace: 'UserGroup_Delete',
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

export { DeleteUserGroupsController };
