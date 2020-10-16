import languages from '../../app/shared/languages';
import baseProperties from './base_properties';
import settings from './settings';
import dynamicTemplates from './dynamic_templates';

const config = {
  settings,
  mappings: {
    dynamic_templates: dynamicTemplates,
    properties: baseProperties,
  },
};

languages.getAll().forEach(language => {
  config.settings.analysis.filter[`${language}_stop`] = {
    type: 'stop',
    stopwords: `_${language}_`,
  };

  const filters = [];
  if (language === 'arabic') {
    filters.push('arabic_normalization');
  }
  if (language === 'persian') {
    filters.push('arabic_normalization');
    filters.push('persian_normalization');
  }
  if (language !== 'persian' && language !== 'thai' && language !== 'cjk') {
    config.settings.analysis.filter[`${language}_stemmer`] = {
      type: 'stemmer',
      language,
    };
    filters.push(`${language}_stemmer`);
  }

  config.settings.analysis.analyzer[`stop_${language}`] = {
    type: 'custom',
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding', `${language}_stop`].concat(filters),
    char_filter: ['remove_annotation'],
  };

  config.settings.analysis.analyzer[`fulltext_${language}`] = {
    type: 'custom',
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding'].concat(filters),
    char_filter: ['remove_annotation'],
  };

  const mapping = {};
  mapping[`fullText_${language}`] = {
    match: `fullText_${language}`,
    match_mapping_type: 'string',
    mapping: {
      type: 'text',
      index: true,
      analyzer: `fulltext_${language}`,
      search_analyzer: `stop_${language}`,
      search_quote_analyzer: `fulltext_${language}`,
      term_vector: 'with_positions_offsets',
    },
  };

  config.mappings.dynamic_templates.unshift(mapping);
});

export default config;
