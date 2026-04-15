import { elasticLanguageCodes } from '#shared/language/index.js';

const noStemmerLanguages = new Set(['persian', 'thai', 'cjk']);

export const buildFullTextLanguageAnalyzers = () =>
  Object.fromEntries(
    elasticLanguageCodes.flatMap(lang => {
      const extraFilters: string[] = [];
      if (lang === 'arabic') extraFilters.push('arabic_normalization');
      if (lang === 'persian') extraFilters.push('arabic_normalization', 'persian_normalization');
      if (!noStemmerLanguages.has(lang)) extraFilters.push(`${lang}_stemmer`);

      return [
        [
          `stop_${lang}`,
          {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding', `${lang}_stop`, ...extraFilters],
            char_filter: ['remove_annotation'],
          },
        ],
        [
          `fulltext_${lang}`,
          {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding', ...extraFilters],
            char_filter: ['remove_annotation'],
          },
        ],
      ];
    })
  );
