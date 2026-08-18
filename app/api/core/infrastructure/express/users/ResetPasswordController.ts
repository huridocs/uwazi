import type { ResetPasswordRequest, ResetPasswordResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ResetPasswordInputSchema } from '#api/core/application/ResetPassword.js';
import { ResetPasswordUseCaseFactory } from '../../factories/ResetPasswordUseCaseFactory.js';

class ResetPasswordController extends AbstractController<ResetPasswordRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const input = ResetPasswordInputSchema.parse(this.request.body);

      const useCase = ResetPasswordUseCaseFactory.default();

      await useCase.execute(input);

      ExecutionContext.logger.info('Password reset executed successfully', {
        namespace: 'Users_Utilities',
        success: true,
        durationMs: Date.now() - startTime,
      });

      const response: ResetPasswordResponse = 'OK';
      this.response.json(response);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Users_Utilities',
          success: false,
          notify: true,
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }
}

export { ResetPasswordController };
