import { LanguageCode } from './availableLanguages.js';
import { franc } from './franc/index.js';
import { LanguageUtils } from './languageUtils.js';

const detectLanguage = (text: string, purpose: LanguageCode = 'elastic') =>
  LanguageUtils.fromISO639_3(franc(text))?.[purpose];

export { detectLanguage };
