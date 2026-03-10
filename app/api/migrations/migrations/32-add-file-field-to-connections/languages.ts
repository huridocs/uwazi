import { elasticLanguages } from './languageList';

export default {
  data: Object.keys(elasticLanguages).map(k => elasticLanguages[k]),
};
