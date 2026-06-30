import { z } from 'zod';
import type { DeleteUserRequest, DeleteUserResponse } from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteUsersUseCaseFactory } from '../../factories/DeleteUsersUseCaseFactory.js';

const DeleteUsersInputSchema = z.object({
  ids: z.string().transform((value, context) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ids must be an array of strings',
        });
        return z.NEVER;
      }
      return parsed;
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids must be a valid JSON array',
      });
      return z.NEVER;
    }
  }),
});

class DeleteUserController extends AbstractController<DeleteUserRequest> {
  // eslint-disable-next-line max-statements
  protected async handle(): Promise<void> {
    if (ExecutionContext.tenant.featureFlags?.v2DeleteUser) {
      const startTime = Date.now();
      try {
        const input = DeleteUsersInputSchema.parse(this.request.query);

        const useCase = DeleteUsersUseCaseFactory.default();

        const result = await useCase.execute(input);

        ExecutionContext.logger.info('User(s) deleted successfully', {
          namespace: 'Users_Delete',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: DeleteUserResponse = {
          acknowledged: true,
          deletedCount: result,
        };

        this.response.status(200).json(response);
      } catch (error: unknown) {
        ExecutionContext.logger.info(
          `User deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Users_Delete',
            success: false,
            error: JSON.stringify(error),
          }
        );
        throw error;
      }
    } else {
      const { ids } = DeleteUsersInputSchema.parse(this.request.query);
      const result = await users.delete(ids, this.request.user);
      const response: DeleteUserResponse = {
        acknowledged: true,
        deletedCount: result.deletedCount ?? ids.length,
      };
      this.response.json(response);
    }
  }
}

export { DeleteUserController };
