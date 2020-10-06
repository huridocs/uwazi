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
    unmapped_fields: {
      match: '*',
      mapping: {
        index: false,
      },
    },
  },
];

export default dynamicTemplates;
