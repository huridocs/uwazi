import franc from 'franc';
import get from 'shared/languagesList';

const detect = (text: string, purpose = 'elastic') => get(franc(text), purpose);
export { detect };
