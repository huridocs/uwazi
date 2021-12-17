import franc from 'franc';
import { language as get } from 'shared/languagesList';

const detectLanguage = (text: string, purpose: 'elastic' | 'franc' | 'ISO639_1' = 'elastic') =>
  get(franc(text), purpose);
export { detectLanguage };
