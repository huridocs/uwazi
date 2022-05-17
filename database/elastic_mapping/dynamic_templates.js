const dynamicTemplates = [
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
    relationships_fields: {
      path_match: 'relationships',
      mapping: { type: 'nested' },
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
    nested_props: {
      match_mapping_type: 'string',
      path_match: '*_nested.value.*',
      mapping: {
        type: 'text',
        fields: {
          raw: {
            type: 'keyword',
          },
          sort: {
            type: 'text',
            analyzer: 'string_sorter',
            fielddata: true,
          },
        },
        term_vector: 'with_positions_offsets',
        analyzer: 'tokenizer',
      },
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
  {
    unmapped_objects: {
      match: '*',
      match_mapping_type: 'object',
      mapping: {
        enabled: false,
      },
    },
  },
  {
    unmapped_fields: {
      match: '*',
      mapping: {
        index: false,
      },
    },
  },
];

export default dynamicTemplates;
