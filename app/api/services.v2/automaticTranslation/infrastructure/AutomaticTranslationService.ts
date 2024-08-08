import { LanguageISO6391 } from 'shared/types/commonTypes';
import { AutomaticTranslationGateway } from '../contracts/AutomaticTranslationGateway';

export class AutomaticTranslationService implements AutomaticTranslationGateway {
  // eslint-disable-next-line class-methods-use-this
  async supportedLanguages() {
    const result: LanguageISO6391[] = ['ru', 'en', 'fr', 'es'];
    return result;
  }
}
