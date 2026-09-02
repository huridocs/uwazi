import type { ResetPasswordRequest, ResetPasswordResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ResetPasswordInputSchema } from '#api/core/application/ResetPassword.js';
import { ResetPasswordUseCaseFactory } from '../../factories/ResetPasswordUseCaseFactory.js';

class ResetPasswordController extends AbstractController<ResetPasswordRequest> {
  protected async handle(): Promise<void> {
    const input = ResetPasswordInputSchema.parse(this.request.body);

    const useCase = ResetPasswordUseCaseFactory.default();

    await useCase.execute(input);

    const response: ResetPasswordResponse = 'OK';
    this.response.json(response);
  }
}

export { ResetPasswordController };
