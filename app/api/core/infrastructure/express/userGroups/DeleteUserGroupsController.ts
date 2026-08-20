import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteUserGroupsUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUserGroupsUseCaseFactory.js';
import { IdListQuerySchema } from '#api/core/libs/Id.js';
import type { DeleteUserGroupsResponse } from '#shared/contracts/UserGroups.js';

const DeleteUserGroupsQuerySchema = z.object({ ids: IdListQuerySchema });

class DeleteUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const parsed = DeleteUserGroupsQuerySchema.parse(this.request.query);

      const response: DeleteUserGroupsResponse =
        await DeleteUserGroupsUseCaseFactory.default().execute({
          ids: parsed.ids,
        });

      this.response.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      ExecutionContext.logger.info(`User groups delete failed: ${errorMessage}`, {
        namespace: 'UserGroup_Delete',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        error: JSON.stringify(error),
      });

      throw error;
    }
  }
}

export { DeleteUserGroupsController };
