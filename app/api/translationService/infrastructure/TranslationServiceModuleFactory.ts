import { RequestTranslation } from '../application/RequestTranslation.js';
import { TranslationServiceFactory } from './TranslationServiceFactory.js';

class TranslationServiceModuleFactory {
  static createRequestTranslation() {
    return new RequestTranslation({
      translationService: TranslationServiceFactory.createDefault(),
    });
  }
}

export { TranslationServiceModuleFactory };
