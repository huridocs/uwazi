import type { CreateUserRequest, CreateUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateUserUseCaseFactory } from '../../factories/CreateUserUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserCreateSchema } from '#api/core/application/CreateUser.js';
import users from '#api/users/users.js';

class CreateUserController extends AbstractController<CreateUserRequest> {
  protected async handle(): Promise<void> {
    const domain = `${this.request.protocol}://${ExecutionContext.tenant.domain}`;
    if (ExecutionContext.tenant.featureFlags?.v2CreateUser) {
      const newUser = UserCreateSchema.parse(this.request.body);
      const useCase = CreateUserUseCaseFactory.default();
      const { password, ...user } = await useCase.execute({
        user: newUser,
        domain,
      });
      const response: CreateUserResponse = {
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      };
      this.response.status(201).json(response);
    } else {
      users
        .newUser(this.request.body, domain)
        .then(response => this.response.json(response))
        .catch(this.request.next);
    }
  }
}

export { CreateUserController };
