import type { ResetPasswordRequest, ResetPasswordResponse } from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ResetPasswordInputSchema } from '#api/core/application/ResetPassword.js';
import { ResetPasswordUseCaseFactory } from '../../factories/ResetPasswordUseCaseFactory.js';

class ResetPasswordController extends AbstractController<ResetPasswordRequest> {
  protected async handle(): Promise<void> {
    if (ExecutionContext.tenant.featureFlags?.v2UsersUtilityRoutes) {
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
            error: JSON.stringify(error),
          }
        );

        throw error;
      }
    } else {
      const response = await users.resetPassword(this.request.body);
      this.response.json(response);
    }
  }
}

export { ResetPasswordController };
