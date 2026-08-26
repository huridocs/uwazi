import type {
  ResetTwoFactorAuthRequest,
  ResetTwoFactorAuthResponse,
} from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ResetTwoFactorAuthInputSchema } from '#api/core/application/ResetTwoFactorAuth.js';
import { ResetTwoFactorAuthUseCaseFactory } from '../../factories/ResetTwoFactorAuthUseCaseFactory.js';

class ResetTwoFactorAuthController extends AbstractController<ResetTwoFactorAuthRequest> {
  protected async handle(): Promise<void> {
    const input = ResetTwoFactorAuthInputSchema.parse(this.request.body);

    const useCase = ResetTwoFactorAuthUseCaseFactory.default();

    await useCase.execute(input);

    const response: ResetTwoFactorAuthResponse = { success: true };
    this.response.json(response);
  }
}

export { ResetTwoFactorAuthController };
