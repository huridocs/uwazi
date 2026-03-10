import { LanguageISO6391 } from 'shared/types/commonTypes';

export interface ATGateway {
  supportedLanguages(): Promise<LanguageISO6391[]>;
}
