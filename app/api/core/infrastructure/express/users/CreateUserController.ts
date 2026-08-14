import type { CreateUserRequest, CreateUserResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateUserInputSchema } from '#api/core/application/CreateUser.js';
import { CreateUserUseCaseFactory } from '../../factories/CreateUserUseCaseFactory.js';

class CreateUserController extends AbstractController<CreateUserRequest> {
  protected async handle(): Promise<void> {
    const domain = `${this.request.protocol}://${ExecutionContext.tenant.domain}`;
    const startTime = Date.now();
    try {
      const input = CreateUserInputSchema.parse({
        ...this.request.body,
        assignedGroupIds: this.request.body.groups?.map(g => g._id),
        domain,
      });

      const useCase = CreateUserUseCaseFactory.default();

      const user = await useCase.execute(input);
      ExecutionContext.logger.info('User created successfully', {
        namespace: 'Users_Creation',
        success: true,
        durationMs: Date.now() - startTime,
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
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `User Creation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Users_Creation',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { CreateUserController };
