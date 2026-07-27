import type {
  UnlockBlockedUserRequest,
  UnlockBlockedUserResponse,
} from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UnlockBlockedUserInputSchema } from '#api/core/application/UnlockBlockedUser.js';
import { UnlockBlockedUserUseCaseFactory } from '../../factories/UnlockBlockedUserUseCaseFactory.js';

class UnlockBlockedUserController extends AbstractController<UnlockBlockedUserRequest> {
  protected async handle(): Promise<void> {
    if (ExecutionContext.tenant.featureFlags?.v2UsersUtilityRoutes) {
      const startTime = Date.now();
      try {
        const input = UnlockBlockedUserInputSchema.parse(this.request.body);

        const useCase = UnlockBlockedUserUseCaseFactory.default();

        await useCase.execute(input);

        ExecutionContext.logger.info('Admin unlock executed successfully', {
          namespace: 'Users_Utilities',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: UnlockBlockedUserResponse = 'OK';
        this.response.json(response);
      } catch (error: unknown) {
        ExecutionContext.logger.info(
          `Admin unlock failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Users_Utilities',
            success: false,
            error: JSON.stringify(error),
          }
        );

        throw error;
      }
    } else {
      await users.simpleUnlock(this.request.body._id);
      this.response.json('OK');
    }
  }
}

export { UnlockBlockedUserController };
