import type { UpdateUserRequest, UpdateUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UpdateUserInputSchema } from '#api/core/application/UpdateUser.js';
import { UpdateUserUseCaseFactory } from '../../factories/UpdateUserUseCaseFactory.js';

/**
 * The settings form always posts the whole profile, and this endpoint's contract requires it:
 * the use case accepts partial updates, the HTTP API does not.
 */
const UpdateUserRequestSchema = UpdateUserInputSchema.required({
  username: true,
  email: true,
  role: true,
});

class UpdateUserController extends AbstractController<UpdateUserRequest> {
  protected async handle(): Promise<void> {
    const parsed = UpdateUserRequestSchema.parse({
      ...this.request.body,
      assignedGroupIds: this.request.body.groups?.map(g => g._id),
    });

    const useCase = UpdateUserUseCaseFactory.default();

    const user = await useCase.execute(parsed);

    const response: UpdateUserResponse = {
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    };

    this.response.status(201).json(response);
  }
}

export { UpdateUserController };
