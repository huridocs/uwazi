/** @format */
/* eslint-disable camelcase */

import languages from '../app/shared/languages';

const config = {
  settings: {
    'index.mapping.total_fields.limit': 4000,
    'index.number_of_replicas': 0,
    'index.number_of_shards': 3,
    analysis: {
      char_filter: {
        remove_annotation: {
          type: 'pattern_replace',
          pattern: '\\[\\[[0-9]+\\]\\]',
          replacement: '',
        },
      },
      filter: {},
      analyzer: {
        other: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'],
          char_filter: ['remove_annotation'],
        },
        tokenizer: {
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'],
        },
        string_sorter: {
          tokenizer: 'keyword',
          filter: ['lowercase', 'asciifolding', 'trim'],
        },
      },
    },
  },
  mappings: {
    dynamic_templates: [
      {
        message_field: {
          match: 'message',
          match_mapping_type: 'string',
          mapping: {
            type: 'string',
            index: true,
            omit_norms: true,
            fielddata: { format: 'disabled' },
          },
        },
      },
      {
        fullText_other: {
          match: 'fullText_other',
          match_mapping_type: 'string',
          mapping: {
            type: 'text',
            index: true,
            omit_norms: true,
            analyzer: 'other',
            term_vector: 'with_positions_offsets',
          },
        },
      },
      {
        string_fields: {
          match: '*',
          match_mapping_type: 'string',
          mapping: {
            type: 'text',
            index: true,
            omit_norms: true,
            analyzer: 'tokenizer',
            fields: {
              raw: { type: 'keyword' },
              sort: { type: 'text', fielddata: true, analyzer: 'string_sorter' },
            },
            term_vector: 'with_positions_offsets',
          },
        },
      },
      {
        double_fields: {
          match: '*',
          match_mapping_type: 'double',
          mapping: {
            type: 'double',
            doc_values: true,
            fields: {
              sort: { type: 'double' },
            },
          },
        },
      },
      {
        binary_fields: {
          match: '*',
          match_mapping_type: 'binary',
          mapping: { type: 'binary', doc_values: true },
        },
      },
      {
        long_fields: {
          match: '*',
          match_mapping_type: 'long',
          mapping: {
            type: 'double',
            doc_values: true,
            fields: {
              raw: { type: 'double', index: false },
              sort: { type: 'double' },
            },
          },
        },
      },
      {
        date_fields: {
          match: '*',
          match_mapping_type: 'date',
          mapping: { type: 'date', doc_values: true },
        },
      },
      {
        relationships_fields: {
          path_match: 'relationships',
          mapping: { type: 'nested' },
        },
      },
      {
        geo_point_fields: {
          match: '*_geolocation',
          path_match: 'metadata.*',
          mapping: { type: 'object' },
        },
      },
      {
        nested_fields: {
          match_mapping_type: 'object',
          path_match: '*_nested.value',
          mapping: { type: 'nested' },
        },
      },
      {
        object_fields: {
          match_mapping_type: 'object',
          path_match: 'metadata.*',
          mapping: { type: 'object' },
        },
      },
      {
        object_fields: {
          match_mapping_type: 'object',
          path_match: 'suggestedMetadata.*',
          mapping: { type: 'object' },
        },
      },
    ],
    properties: {
      '@timestamp': { type: 'date', doc_values: true },
      '@version': { type: 'text', index: false },
      fullText: { type: 'join', relations: { entity: 'fullText' } },
      title: {
        type: 'text',
        index: true,
        fields: {
          raw: { type: 'keyword' },
          sort: { type: 'text', fielddata: true, analyzer: 'string_sorter' },
          sayt: { type: 'search_as_you_type' },
        },
        term_vector: 'with_positions_offsets',
      },
      creationDate: {
        type: 'long',
        doc_values: true,
        fields: {
          raw: { type: 'long', index: false },
          sort: { type: 'long' },
        },
      },
      geoip: {
        type: 'object',
        dynamic: true,
        properties: {
          ip: { type: 'ip', doc_values: true },
          location: { type: 'geo_point', doc_values: true },
          latitude: { type: 'float', doc_values: true },
          longitude: { type: 'float', doc_values: true },
        },
      },
    },
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
      omit_norms: true,
      analyzer: `fulltext_${language}`,
      search_analyzer: `stop_${language}`,
      search_quote_analyzer: `fulltext_${language}`,
      term_vector: 'with_positions_offsets',
    },
  };

  config.mappings.dynamic_templates.unshift(mapping);
});

export default config;
