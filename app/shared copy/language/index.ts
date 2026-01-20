import { LanguageUtils } from '#shared/language/languageUtils.js';

const ISO6391Languages = LanguageUtils.getByCode('ISO639_1');
const ISO6391Codes = LanguageUtils.getCodes(ISO6391Languages, 'ISO639_1');

const elasticLanguages = LanguageUtils.getByCode('elastic');
const elasticLanguageCodes = LanguageUtils.getCodes(elasticLanguages, 'elastic');

export { elasticLanguages, elasticLanguageCodes, ISO6391Codes, LanguageUtils };
export { availableLanguages } from '#shared/language/availableLanguages.js';

export type { LanguageCode } from '#shared/language/availableLanguages.js';
