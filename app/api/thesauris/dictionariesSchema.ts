/** @format */

export default {
  $async: true,
  title: 'Thesaurus',
  type: 'object',
  required: ['name'],
  properties: {
    name: {
      type: 'string',
      uniqueName: '',
      minLength: 1,
    },
    values: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label'],
        properties: {
          label: {
            type: 'id',
            minLength: 1,
          },
          label: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    },
  },
};
