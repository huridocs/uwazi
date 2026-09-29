import { tenants } from '#api/tenants/index.js';
import { HttpClientFactory } from '#api/common.v2/infrastructure/HttpClientFactory.js';
import type { TranslationService } from '../application/contracts/TranslationService.js';
import { ExternalTranslationService } from './ExternalTranslationService.js';

class TranslationServiceFactory {
  static createDefault(): TranslationService {
    const url = tenants.current().featureFlags?.translationServiceUrl;

    if (!url) {
      throw new Error('Translation service URL is not configured for this tenant');
    }

    return new ExternalTranslationService({
      url,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}

export { TranslationServiceFactory };
