/* eslint-disable max-statements */
import { z } from 'zod';
import type { DeleteUserRequest, DeleteUserResponse } from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteUsersUseCaseFactory } from '../../factories/DeleteUsersUseCaseFactory.js';
import { DeleteUserInputSchema } from '#api/core/application/DeleteUsers.js';

const IdsSchema = z.string().transform((value, context) => {
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ids must be a valid JSON array',
    });
    return z.NEVER;
  }
});

class DeleteUserController extends AbstractController<DeleteUserRequest> {
  protected async handle(): Promise<void> {
    const parsed = {
      ids:
        typeof this.request.query.ids === 'string'
          ? IdsSchema.parse(this.request.query.ids)
          : this.request.query.ids,
    };

    const input = DeleteUserInputSchema.parse(parsed);

    if (ExecutionContext.tenant.featureFlags?.v2UsersDelete) {
      const startTime = Date.now();
      try {
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
      const result = await users.delete(input.ids, this.request.user);
      const response: DeleteUserResponse = {
        acknowledged: true,
        deletedCount: result.deletedCount ?? input.ids.length,
      };
      this.response.json(response);
    }
  }
}

export { DeleteUserController };
