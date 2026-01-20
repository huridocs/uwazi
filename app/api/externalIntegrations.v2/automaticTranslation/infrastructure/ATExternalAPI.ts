import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ATGateway } from '#api/externalIntegrations.v2/automaticTranslation/contracts/ATGateway.js';

export class ATExternalAPI implements ATGateway {
  // eslint-disable-next-line class-methods-use-this
  async supportedLanguages() {
    const result: LanguageISO6391[] = [
      'ru',
      'en',
      'fr',
      'es',
      'ar',
      'zh-Hans',
      'zh-Hant',
      'zh',
      'cs',
      'nl',
      'de',
      'el',
      'he',
      'hi',
      'in',
      'it',
      'ja',
      'ko',
      'fa',
      'pl',
      'pt',
      'ro',
      'tr',
      'uk',
      'vi',
    ];
    return result;
  }
}
