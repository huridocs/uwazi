import type {
  UnlockBlockedUserRequest,
  UnlockBlockedUserResponse,
} from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UnlockBlockedUserInputSchema } from '#api/core/application/UnlockBlockedUser.js';
import { UnlockBlockedUserUseCaseFactory } from '../../factories/UnlockBlockedUserUseCaseFactory.js';

class UnlockBlockedUserController extends AbstractController<UnlockBlockedUserRequest> {
  protected async handle(): Promise<void> {
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
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { UnlockBlockedUserController };
