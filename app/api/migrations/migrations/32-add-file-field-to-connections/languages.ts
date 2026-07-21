import { elasticLanguages } from './languageList.js';

export default {
  data: Object.keys(elasticLanguages).map(k => elasticLanguages[k]),
};
