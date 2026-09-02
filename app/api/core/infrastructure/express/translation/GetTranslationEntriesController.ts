import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';

class GetTranslationEntriesController extends AbstractController {
  protected async handle(): Promise<void> {
    const translationsDS = TranslationsDataSourceFactory.default({
      transactionManager: TransactionManagerFactory.default(),
    });
    const translationList = await translationsDS.getAll();
    this.response.json(translationList);
  }
}

export { GetTranslationEntriesController };
