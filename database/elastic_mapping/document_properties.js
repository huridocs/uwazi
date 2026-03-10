import TOCProperties from './toc_properties';

const properties = {
  properties: {
    _id: {
      type: 'keyword',
      fields: {
        raw: { type: 'keyword' },
        sort: { type: 'keyword' },
      },
    },
    creationDate: {
      type: 'date',
      format: 'epoch_millis',
      fields: {
        raw: { type: 'date', index: false },
        sort: { type: 'date' },
      },
    },
    entity: {
      type: 'keyword',
      fields: {
        raw: { type: 'keyword' },
        sort: { type: 'keyword' },
      },
    },
    filename: {
      type: 'object',
      enabled: false,
    },
    language: {
      type: 'keyword',
    },
    mimetype: {
      type: 'object',
      enabled: false,
    },
    originalname: {
      type: 'object',
      enabled: false,
    },
    size: {
      type: 'integer',
      index: false,
    },
    status: {
      type: 'keyword',
      fields: {
        raw: { type: 'keyword' },
        sort: { type: 'keyword' },
      },
    },
    timestamp: {
      type: 'date',
      format: 'epoch_millis',
      fields: {
        raw: { type: 'date', index: false },
        sort: { type: 'date' },
      },
    },
    totalPages: {
      type: 'short',
      index: false,
    },
    type: {
      type: 'keyword',
      fields: {
        raw: { type: 'keyword' },
        sort: { type: 'keyword' },
      },
    },
    toc: TOCProperties,
  },
};

export default properties;
