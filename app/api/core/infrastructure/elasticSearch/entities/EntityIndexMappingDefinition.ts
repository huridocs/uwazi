import { elasticLanguageCodes } from '#shared/language/index.js';
import { IndexDefinition } from '../Types.js';
import { createEntityMetadataMapping } from './EntityMetadataMapping.js';
import { buildFullTextLanguageAnalyzers } from './FullTextLanguageAnalyzers.js';
import { buildFullTextLanguageFilters } from './FullTextLanguageFilters.js';

const buildFullTextMappings = () =>
  Object.fromEntries(
    elasticLanguageCodes.map(lang => [
      `fullText_${lang}`,
      {
        type: 'text',
        analyzer: `fulltext_${lang}`,
        search_analyzer: `stop_${lang}`,
        search_quote_analyzer: `fulltext_${lang}`,
        term_vector: 'with_positions_offsets',
      },
    ])
  );

const EntityIndexMappingDefinition: IndexDefinition = {
  alias: 'entities',
  physicalPrefix: 'entities',

  settings: {
    number_of_shards: 6,
    number_of_replicas: 1,

    'index.mapping.total_fields.limit': 5000,

    analysis: {
      normalizer: {
        string_sorter_normalized: {
          type: 'custom',
          filter: ['lowercase', 'asciifolding'],
        },
      },

      char_filter: {
        remove_annotation: {
          type: 'pattern_replace',
          pattern: '\\[\\[[0-9]+\\]\\]',
          replacement: '',
        },
      },

      filter: buildFullTextLanguageFilters(),

      analyzer: {
        other: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'],
          char_filter: ['remove_annotation'],
        },

        title_sayt: {
          type: 'custom',
          tokenizer: 'title_sayt',
          filter: ['lowercase', 'asciifolding'],
        },

        ...buildFullTextLanguageAnalyzers(),
      },

      tokenizer: {
        title_sayt: {
          type: 'ngram',
          min_gram: 3,
          max_gram: 4,
          token_chars: ['letter', 'digit'],
        },
      },
    },
  },

  mappings: {
    dynamic: false,
    _routing: { required: true },
    properties: {
      // Used on all ES documents on this Index
      tenantId: { type: 'keyword' },
      // ==================================

      // Used on all fullText ES documents
      filename: { type: 'keyword' },
      fileId: { type: 'keyword' },
      fullText: {
        type: 'join',
        relations: { entity: 'fullText' },
      },
      fullText_other: {
        type: 'text',
        analyzer: 'other',
        term_vector: 'with_positions_offsets',
      },
      ...buildFullTextMappings(),
      // ==============================

      // Used on all ES Entity documents
      template: { type: 'keyword' },
      language: { type: 'keyword' },
      user: { type: 'keyword' },
      sharedId: { type: 'keyword' },
      permissionRefIds: { type: 'keyword' },

      published: { type: 'boolean' },

      creationDate: { type: 'date', format: 'epoch_millis' },
      editDate: { type: 'date', format: 'epoch_millis' },

      rawEntity: { type: 'object', enabled: false },

      title: {
        type: 'text',
        analyzer: 'other',
        fields: {
          sort: {
            type: 'keyword',
            ignore_above: 1024,
            normalizer: 'string_sorter_normalized',
          },
          sayt: { type: 'search_as_you_type' },
        },
      },

      metadata: {
        properties: { ...createEntityMetadataMapping() },
      },
      // ===============================
    },
  },
};

export { EntityIndexMappingDefinition };
