import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';

class GetTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    const translationsDS = TranslationsDataSourceFactory.default({
      transactionManager: ExecutionContext.transactionManager,
    });
    const translationList = await translationsDS.getAll();
    this.response.json(translationList);
  }
}

export { GetTranslationEntriesController };
