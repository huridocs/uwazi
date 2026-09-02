import type { GenerateTwoFactorSecretResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GenerateTwoFactorSecretUseCaseFactory } from '../../factories/GenerateTwoFactorSecretUseCaseFactory.js';

class GenerateTwoFactorSecretController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = GenerateTwoFactorSecretUseCaseFactory.default();

    const result = await useCase.execute();

    const response: GenerateTwoFactorSecretResponse = result;
    this.response.json(response);
  }
}

export { GenerateTwoFactorSecretController };
