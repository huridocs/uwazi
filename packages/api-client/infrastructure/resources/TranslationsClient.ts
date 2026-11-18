import { GetTranslationEntriesController } from '#api/core/infrastructure/express/translation/GetTranslationEntriesController.js';
import { GetTranslationsController } from '#api/core/infrastructure/express/translation/GetTranslationsController.js';

import type { TranslationsResource } from '../../application/ServerApiClient.js';
import type {
  LegacyTranslationsQuery,
  LegacyTranslationsResponse,
  TranslationEntriesResponse,
} from '../../application/contracts/Translations.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class TranslationsClient implements TranslationsResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getLegacy(query: LegacyTranslationsQuery = {}) {
    return this.invoker.invoke<LegacyTranslationsResponse>(GetTranslationsController, query);
  }

  async getEntries() {
    return this.invoker.invoke<TranslationEntriesResponse>(GetTranslationEntriesController);
  }
}

export { TranslationsClient };
