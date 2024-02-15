const settings = {
  'index.mapping.total_fields.limit': 4500,
  'index.number_of_replicas': 0,
  'index.number_of_shards': 1,
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
      title_sayt: {
        tokenizer: 'title_sayt',
        filter: ['lowercase', 'asciifolding'],
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
    tokenizer: {
      title_sayt: {
        type: 'ngram',
        min_gram: 3,
        max_gram: 4,
        token_chars: ['letter', 'digit'],
      },
    },
  },
};

export default settings;
