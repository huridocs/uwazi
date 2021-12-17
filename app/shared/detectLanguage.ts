import franc from 'franc';
import { language } from 'shared/languagesList';

const detectLanguage = (text: string, purpose: 'elastic' | 'franc' | 'ISO639_1' = 'elastic') =>
  language(franc(text), purpose);
export { detectLanguage };
