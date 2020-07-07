const properties = {
  properties: {
    _id: {
      type: 'keyword',
      fields: {
        raw: { type: 'keyword' },
        sort: { type: 'keyword' },
      },
    },
    indentation: {
      type: 'short',
      index: false,
    },
    range: {
      properties: {
        end: {
          type: 'integer',
          index: false,
        },
        start: {
          type: 'integer',
          index: false,
        },
      },
    },
  },
};

export default properties;
