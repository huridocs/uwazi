import type { UnlockAccountRequest, UnlockAccountResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UnlockAccountInputSchema } from '#api/core/application/UnlockAccount.js';
import { UnlockAccountUseCaseFactory } from '../../factories/UnlockAccountUseCaseFactory.js';

class UnlockAccountController extends AbstractController<UnlockAccountRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const input = UnlockAccountInputSchema.parse(this.request.body);

      const useCase = UnlockAccountUseCaseFactory.default();

      await useCase.execute(input);

      ExecutionContext.logger.info('Self-service account unlock executed successfully', {
        namespace: 'Users_Utilities',
        success: true,
        durationMs: Date.now() - startTime,
      });

      const response: UnlockAccountResponse = 'OK';
      this.response.json(response);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Self-service account unlock failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export { UnlockAccountController };
