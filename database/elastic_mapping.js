/* eslint-disable camelcase */
import languages from '../app/shared/languages';

let config = {
  settings: {
    analysis: {
      char_filter: {
        remove_annotation: {
          type: 'pattern_replace',
          pattern: '\\[\\[[0-9]+\\]\\]',
          replacement: ''
        }
      },
      analyzer: {
        other: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'],
          char_filter: ['remove_annotation']
        },
        tokenizer: {
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding']
        },
        string_sorter: {
          tokenizer: 'keyword',
          filter: ['lowercase', 'asciifolding', 'trim']
        }
      }
    }
  },
  mappings: {
    fullText: {
      _parent: {
        type: 'entity'
      }
    },
    _default_: {
      _all: {enabled: true, omit_norms: true},
      dynamic_templates: [ {
        message_field: {
          match: 'message',
          match_mapping_type: 'string',
          mapping: {
            type: 'string', index: 'analyzed', omit_norms: true, fielddata: {format: 'disabled'}
          }
        }
      }, {
        fullText_other: {
          match: 'fullText_other',
          match_mapping_type: 'string',
          mapping: {
            type: 'text',
            index: 'analyzed',
            omit_norms: true,
            analyzer: 'other',
            term_vector: 'with_positions_offsets'
          }
        }
      }, {
        string_fields: {
          match: '*',
          match_mapping_type: 'string',
          mapping: {
            type: 'string',
            index: 'analyzed',
            omit_norms: true,
            analyzer: 'tokenizer',
            fields: {
              raw: {type: 'keyword'},
              sort: {type: 'text', fielddata: true, analyzer: 'string_sorter'}
            }
          }
        }
      }, {
        float_fields: {
          match: '*',
          match_mapping_type: 'float',
          mapping: {type: 'float', doc_values: true}
        }
      }, {
        double_fields: {
          match: '*',
          match_mapping_type: 'double',
          mapping: {
            type: 'double',
            doc_values: true,
            fields: {
              sort: {type: 'double'}
            }
          }
        }
      }, {
        byte_fields: {
          match: '*',
          match_mapping_type: 'byte',
          mapping: {type: 'byte', doc_values: true}
        }
      }, {
        short_fields: {
          match: '*',
          match_mapping_type: 'short',
          mapping: {type: 'short', doc_values: true}
        }
      }, {
        integer_fields: {
          match: '*',
          match_mapping_type: 'integer',
          mapping: {type: 'integer', doc_values: true}
        }
      }, {
        long_fields: {
          match: '*',
          match_mapping_type: 'long',
          mapping: {
            type: 'double',
            doc_values: true,
            fields: {
              raw: {type: 'double', index: 'not_analyzed'},
              sort: {type: 'double'}
            }
          }
        }
      }, {
        date_fields: {
          match: '*',
          match_mapping_type: 'date',
          mapping: {type: 'date', doc_values: true}
        }
      }, {
        geo_point_fields: {
          match: '*',
          match_mapping_type: 'geo_point',
          mapping: {type: 'geo_point', doc_values: true}
        }
      }, {
        nested_fields: {
          match_mapping_type: 'object',
          path_match: 'metadata.*',
          path_unmatch: 'metadata.*.*',
          mapping: {type: 'nested'}
        }
      }],
      properties: {
        '@timestamp': {type: 'date', doc_values: true},
        '@version': {type: 'string', index: 'not_analyzed', doc_values: true},
        creationDate: {
          type: 'long',
          doc_values: true,
          fields: {
            raw: {type: 'long', index: 'not_analyzed'},
            sort: {type: 'long'}
          }
        },
        geoip: {
          type: 'object',
          dynamic: true,
          properties: {
            ip: {type: 'ip', doc_values: true},
            location: {type: 'geo_point', doc_values: true},
            latitude: {type: 'float', doc_values: true},
            longitude: {type: 'float', doc_values: true}
          }
        }
      }
    }
  }
};


languages.getAll().forEach((language) => {
  config.settings.analysis.analyzer[language] = {
    type: language,
    tokenizer: 'standard',
    filter: ['lowercase', 'asciifolding'],
    char_filter: ['remove_annotation']
  };

  let mapping = {};
  mapping[`fullText_${language}`] = {
    match: `fullText_${language}`,
    match_mapping_type: 'string',
    mapping: {
      type: 'text',
      index: 'analyzed',
      omit_norms: true,
      analyzer: language,
      term_vector: 'with_positions_offsets'
    }
  };

  config.mappings._default_.dynamic_templates.unshift(mapping);
});

export default config;
