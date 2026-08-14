import type {
  EnableTwoFactorAuthRequest,
  EnableTwoFactorAuthResponse,
} from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EnableTwoFactorAuthInputSchema } from '#api/core/application/EnableTwoFactorAuth.js';
import { EnableTwoFactorAuthUseCaseFactory } from '../../factories/EnableTwoFactorAuthUseCaseFactory.js';

class EnableTwoFactorAuthController extends AbstractController<EnableTwoFactorAuthRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const input = EnableTwoFactorAuthInputSchema.parse(this.request.body);

      const useCase = EnableTwoFactorAuthUseCaseFactory.default();

      await useCase.execute(input);

      ExecutionContext.logger.info('Two-factor authentication enabled successfully', {
        namespace: 'Users_Utilities',
        success: true,
        durationMs: Date.now() - startTime,
      });

      const response: EnableTwoFactorAuthResponse = { success: true };
      this.response.json(response);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Two-factor authentication enable failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export { EnableTwoFactorAuthController };
