import franc from 'franc';
import get, {languages} from 'shared/languagesList';

export default {
  get,
  data: Object.keys(languages).map(k => languages[k]),
  getAll: (purpose = 'elastic') => {
    const unique = (v, i, a) => a.indexOf(v) === i;
    const notNull = (v) => Boolean(v);
    return Object.keys(languages)
           .map((k) => languages[k][purpose])
           .filter(unique)
           .filter(notNull);
  },

  detect: (text, purpose = 'elastic') => {
    return get(franc(text), purpose);
  }
};
