import type { UnlockAccountRequest, UnlockAccountResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UnlockAccountInputSchema } from '#api/core/application/UnlockAccount.js';
import { UnlockAccountUseCaseFactory } from '../../factories/UnlockAccountUseCaseFactory.js';

class UnlockAccountController extends AbstractController<UnlockAccountRequest> {
  protected async handle(): Promise<void> {
    const input = UnlockAccountInputSchema.parse(this.request.body);

    const useCase = UnlockAccountUseCaseFactory.default();

    await useCase.execute(input);

    const response: UnlockAccountResponse = 'OK';
    this.response.json(response);
  }
}

export { UnlockAccountController };
