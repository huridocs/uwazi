import type { RecoverPasswordRequest, RecoverPasswordResponse } from '#shared/contracts/Users.js';
import users from '#api/users/users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RecoverPasswordInputSchema } from '#api/core/application/RecoverPassword.js';
import { RecoverPasswordUseCaseFactory } from '../../factories/RecoverPasswordUseCaseFactory.js';

class RecoverPasswordController extends AbstractController<RecoverPasswordRequest> {
  protected async handle(): Promise<void> {
    const domain = `${this.request.protocol}://${ExecutionContext.tenant.domain}`;

    if (ExecutionContext.tenant.featureFlags?.v2UsersUtilityRoutes) {
      const startTime = Date.now();
      try {
        const input = RecoverPasswordInputSchema.parse({ ...this.request.body, domain });

        const useCase = RecoverPasswordUseCaseFactory.default();

        await useCase.execute(input);

        ExecutionContext.logger.info('Password recovery email sent successfully', {
          namespace: 'Users_Utilities',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: RecoverPasswordResponse = 'OK';
        this.response.json(response);
      } catch (error: unknown) {
        ExecutionContext.logger.info(
          `Password recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      await users.recoverPassword(this.request.body.email, domain);
      this.response.json('OK');
    }
  }
}

export { RecoverPasswordController };
