import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';

class GetTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    const service = TranslationsQueryServiceFactory.default();
    const translationList = await service.getAll().all();
    this.response.json(translationList);
  }
}

export { GetTranslationEntriesController };
