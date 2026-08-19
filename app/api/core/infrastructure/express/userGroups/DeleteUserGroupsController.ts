import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteUserGroupsUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUserGroupsUseCaseFactory.js';
import type { DeleteUserGroupsResponse } from '#shared/contracts/UserGroups.js';

const IdsSchema = z.string().transform((value, context) => {
  try {
    return JSON.parse(value);
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ids must be a valid JSON array',
    });
    return z.NEVER;
  }
});

const DeleteUserGroupsQuerySchema = z.object({
  ids: z
    .union([z.string(), z.array(z.string())])
    .transform(value => (Array.isArray(value) ? value : [value])),
});

class DeleteUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const rawIds = this.request.query.ids;
      const query = {
        ...this.request.query,
        ids:
          typeof rawIds === 'string' && rawIds.trim().startsWith('[')
            ? IdsSchema.parse(rawIds)
            : rawIds,
      };
      const parsed = DeleteUserGroupsQuerySchema.parse(query);

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
