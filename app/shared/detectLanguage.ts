import franc from 'franc';
import get from 'shared/languagesList';

export default {
  detect: (text: string, purpose = 'elastic') => get(franc(text), purpose),
};
