import { language, elasticLanguages } from 'shared/languagesList';

export default {
  get: language,
  data: Object.keys(elasticLanguages).map(k => elasticLanguages[k]),
  getAll: (purpose = 'elastic') => {
    const unique = (v, i, a) => a.indexOf(v) === i;
    const notNull = v => Boolean(v);
    return Object.keys(elasticLanguages)
      .map(k => elasticLanguages[k][purpose])
      .filter(unique)
      .filter(notNull);
  },
};
