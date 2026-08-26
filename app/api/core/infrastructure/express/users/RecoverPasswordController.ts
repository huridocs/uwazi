import type { RecoverPasswordRequest, RecoverPasswordResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RecoverPasswordInputSchema } from '#api/core/application/RecoverPassword.js';
import { RecoverPasswordUseCaseFactory } from '../../factories/RecoverPasswordUseCaseFactory.js';

class RecoverPasswordController extends AbstractController<RecoverPasswordRequest> {
  protected async handle(): Promise<void> {
    const domain = `${this.request.protocol}://${ExecutionContext.tenant.domain}`;

    const input = RecoverPasswordInputSchema.parse({ ...this.request.body, domain });

    const useCase = RecoverPasswordUseCaseFactory.default();

    await useCase.execute(input);

    const response: RecoverPasswordResponse = 'OK';
    this.response.json(response);
  }
}

export { RecoverPasswordController };
