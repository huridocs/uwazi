import { LanguageISO6391 } from 'shared/types/commonTypes';

export interface AutomaticTranslationGateway {
  supportedLanguages(): Promise<LanguageISO6391[]>;
}
