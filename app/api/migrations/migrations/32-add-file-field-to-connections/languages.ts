import { elasticLanguages } from '#api/migrations/migrations/32-add-file-field-to-connections/languageList.js';

export default {
  data: Object.keys(elasticLanguages).map(k => elasticLanguages[k]),
};
