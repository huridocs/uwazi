import type { GenerateTwoFactorSecretResponse } from '#shared/contracts/Users.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { GenerateTwoFactorSecretUseCaseFactory } from '../../factories/GenerateTwoFactorSecretUseCaseFactory.js';

class GenerateTwoFactorSecretController extends AbstractController {
  protected async handle(): Promise<void> {
    if (ExecutionContext.tenant.featureFlags?.v2Auth2fa) {
      const startTime = Date.now();
      try {
        const useCase = GenerateTwoFactorSecretUseCaseFactory.default();

        const result = await useCase.execute();

        ExecutionContext.logger.info('Two-factor secret generated successfully', {
          namespace: 'Users_Utilities',
          success: true,
          durationMs: Date.now() - startTime,
        });

        const response: GenerateTwoFactorSecretResponse = result;
        this.response.json(response);
      } catch (error: unknown) {
        ExecutionContext.logger.info(
          `Two-factor secret generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const { otpauth, secret } = await usersUtils.setSecret(this.request.user);
      this.response.json({ otpauth, secret });
    }
  }
}

export { GenerateTwoFactorSecretController };
