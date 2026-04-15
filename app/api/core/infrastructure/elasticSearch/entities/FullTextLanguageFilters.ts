import { elasticLanguageCodes } from '#shared/language/index.js';

const noStemmerLanguages = new Set(['persian', 'thai', 'cjk']);

export const buildFullTextLanguageFilters = () =>
  Object.fromEntries(
    elasticLanguageCodes.flatMap(lang => {
      const stopFilter = [`${lang}_stop`, { type: 'stop', stopwords: `_${lang}_` }] as const;
      if (noStemmerLanguages.has(lang)) return [stopFilter];
      return [stopFilter, [`${lang}_stemmer`, { type: 'stemmer', language: lang }]];
    })
  );
