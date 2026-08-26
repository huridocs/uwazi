import type {
  EnableTwoFactorAuthRequest,
  EnableTwoFactorAuthResponse,
} from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { EnableTwoFactorAuthInputSchema } from '#api/core/application/EnableTwoFactorAuth.js';
import { EnableTwoFactorAuthUseCaseFactory } from '../../factories/EnableTwoFactorAuthUseCaseFactory.js';

class EnableTwoFactorAuthController extends AbstractController<EnableTwoFactorAuthRequest> {
  protected async handle(): Promise<void> {
    const input = EnableTwoFactorAuthInputSchema.parse(this.request.body);

    const useCase = EnableTwoFactorAuthUseCaseFactory.default();

    await useCase.execute(input);

    const response: EnableTwoFactorAuthResponse = { success: true };
    this.response.json(response);
  }
}

export { EnableTwoFactorAuthController };
