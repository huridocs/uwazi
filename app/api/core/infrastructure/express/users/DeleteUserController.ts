import { z } from 'zod';
import type { DeleteUserRequest, DeleteUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
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

    const useCase = DeleteUsersUseCaseFactory.default();

    const result = await useCase.execute(input);

    const response: DeleteUserResponse = {
      acknowledged: true,
      deletedCount: result,
    };

    this.response.status(200).json(response);
  }
}

export { DeleteUserController };
