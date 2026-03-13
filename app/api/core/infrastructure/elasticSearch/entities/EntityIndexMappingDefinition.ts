import { IndexDefinition } from '../Types';
import { createEntityMetadataMapping } from './EntityMetadataMapping';

const EntityIndexMappingDefinition: IndexDefinition = {
  alias: 'entities',
  physicalPrefix: 'entities',

  settings: {
    number_of_shards: 6,
    number_of_replicas: 1,

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
      tenantId: { type: 'keyword' },

      fullText: {
        type: 'join',
        relations: { entity: 'fullText' },
      },

      template: { type: 'keyword' },
      language: { type: 'keyword' },
      sharedId: { type: 'keyword' },

      documents: { type: 'object', enabled: false },
      attachments: { type: 'object', enabled: false },

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

      creationDate: { type: 'date', format: 'epoch_millis' },
      editDate: { type: 'date', format: 'epoch_millis' },

      user: { type: 'keyword' },
      published: { type: 'keyword' },

      permissions: {
        type: 'nested',
        properties: {
          refId: { type: 'keyword' },
          level: { type: 'keyword' },
          type: { type: 'keyword' },
        },
      },

      type: { type: 'keyword' },
      generatedToc: { type: 'boolean' },

      metadata: {
        properties: { ...createEntityMetadataMapping() },
      },

      rawEntity: { type: 'object', enabled: false },
    },
  },
};

export { EntityIndexMappingDefinition };
