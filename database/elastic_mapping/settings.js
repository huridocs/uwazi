const settings = {
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
};

export default settings;
