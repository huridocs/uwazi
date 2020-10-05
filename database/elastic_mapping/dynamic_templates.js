const dynamicTemplates = [
  {
    message_field: {
      match: 'message',
      match_mapping_type: 'string',
      mapping: {
        type: 'string',
        index: true,
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
];

export default dynamicTemplates;
