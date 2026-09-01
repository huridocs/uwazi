import type { UpdateUserRequest, UpdateUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UpdateUserInputSchema } from '#api/core/application/UpdateUser.js';
import { UpdateUserUseCaseFactory } from '../../factories/UpdateUserUseCaseFactory.js';

class UpdateUserController extends AbstractController<UpdateUserRequest> {
  protected async handle(): Promise<void> {
    const parsed = UpdateUserInputSchema.parse({
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
