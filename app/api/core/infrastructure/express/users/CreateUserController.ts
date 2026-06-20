import type { CreateUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateUserUseCaseFactory } from '../../factories/CreateUserUseCaseFactory.js';
import {
  UserCreateSchema,
  CreateUserDTO,
} from '#api/core/application/contracts/UserCreateSchema.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class CreateUserController extends AbstractController<CreateUserDTO> {
  protected async handle(): Promise<void> {
    const newUser = UserCreateSchema.parse(this.request.body);
    const useCase = CreateUserUseCaseFactory.default();
    const { password, ...user } = await useCase.execute({
      user: newUser,
      domain: `${this.request.protocol}://${ExecutionContext.tenant.domain}`,
    });
    const response: CreateUserResponse = { user };
    this.response.status(201).json(response);
  }
}

export { CreateUserController };
