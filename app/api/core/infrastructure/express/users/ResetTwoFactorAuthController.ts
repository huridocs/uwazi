import type {
  ResetTwoFactorAuthRequest,
  ResetTwoFactorAuthResponse,
} from '#shared/contracts/Users.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ResetTwoFactorAuthInputSchema } from '#api/core/application/ResetTwoFactorAuth.js';
import { ResetTwoFactorAuthUseCaseFactory } from '../../factories/ResetTwoFactorAuthUseCaseFactory.js';

class ResetTwoFactorAuthController extends AbstractController<ResetTwoFactorAuthRequest> {
  protected async handle(): Promise<void> {
    if (ExecutionContext.tenant.featureFlags?.v2Auth2fa) {
      const startTime = Date.now();
      try {
        const input = ResetTwoFactorAuthInputSchema.parse(this.request.body);

        const useCase = ResetTwoFactorAuthUseCaseFactory.default();

        await useCase.execute(input);

        ExecutionContext.logger.info('Two-factor authentication reset successfully', {
          namespace: 'Users_Utilities',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: ResetTwoFactorAuthResponse = { success: true };
        this.response.json(response);
      } catch (error: unknown) {
        ExecutionContext.logger.info(
          `Two-factor authentication reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Users_Utilities',
            success: false,
            error: JSON.stringify(error),
            notify: true,
          }
        );

        throw error;
      }
    } else {
      await usersUtils.reset2fa({ _id: this.request.body._id });
      this.response.json({ success: true });
    }
  }
}

export { ResetTwoFactorAuthController };
