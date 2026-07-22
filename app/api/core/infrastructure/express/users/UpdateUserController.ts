import type { UpdateUserRequest, UpdateUserResponse } from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateUserInputSchema } from '#api/core/application/UpdateUser.js';
import { UpdateUserUseCaseFactory } from '../../factories/UpdateUserUseCaseFactory.js';

class UpdateUserController extends AbstractController<UpdateUserRequest> {
  protected async handle(): Promise<void> {
    const currentUser = this.user;
    if (ExecutionContext.tenant.featureFlags?.v2UsersUpdate) {
      const startTime = Date.now();
      try {
        const input = UpdateUserInputSchema.parse(this.request.body);

        const useCase = UpdateUserUseCaseFactory.default();

        const user = await useCase.execute(input);

        ExecutionContext.logger.info('User updated successfully', {
          namespace: 'Users_Update',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: UpdateUserResponse = {
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
          `User update execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Users_Update',
            success: false,
            error: JSON.stringify(error),
          }
        );

        throw error;
      }
    } else {
      const input = UpdateUserInputSchema.parse(this.request.body);

      const response = await users.save(input, currentUser);

      this.response.json({
        user: {
          _id: response._id,
          username: response.username,
          role: response.role,
          email: response.email,
        },
      });
    }
  }
}

export { UpdateUserController };
