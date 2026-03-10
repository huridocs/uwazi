import franc from 'franc';
import { LanguageCode, LanguageUtils } from '#shared/language/index.js';

const detectLanguage = (text: string, purpose: LanguageCode = 'elastic') =>
  LanguageUtils.fromISO639_3(franc(text))?.[purpose];

export { detectLanguage };
