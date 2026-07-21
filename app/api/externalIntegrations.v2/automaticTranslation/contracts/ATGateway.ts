import { LanguageISO6391 } from '#shared/types/commonTypes.js';

export interface ATGateway {
  supportedLanguages(): Promise<LanguageISO6391[]>;
}
