import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SetDefaultLanguageUseCaseFactory } from '#api/core/infrastructure/factories/SetDefaultLanguageUseCaseFactory.js';

class SetDefaultLanguageController extends AbstractController {
  protected async handle(): Promise<void> {
    const saved = await SetDefaultLanguageUseCaseFactory.default().execute({
      key: this.request.body.key,
    });
    this.response.json(saved);
  }
}

export { SetDefaultLanguageController };
