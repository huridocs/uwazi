import franc from 'franc';
import get from 'shared/languagesList';

const detectLanguage = (text: string, purpose = 'elastic') => get(franc(text), purpose);
export { detectLanguage };
