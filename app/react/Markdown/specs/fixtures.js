export default {
  getRows: {
    dataset1: { rows: 'rows dataset 1' },
    dataset2: { rows: 'rows dataset 2' },
  },

  getAggregations: {
    dataset1: {
      aggregations: {
        all: {
          property1: {
            buckets: [
              { key: 'id3', filtered: { doc_count: 5 } },
              { key: 'id4', filtered: { doc_count: 7 } },
            ],
          },
          property2: {
            buckets: [
              { key: 'id5', filtered: { doc_count: 5 } },
              { key: 'id6', filtered: { doc_count: 7 } },
            ],
          },
        },
      },
    },

    dataset2: {
      aggregations: {
        all: {
          property3: {
            buckets: [
              { key: 'id7', filtered: { doc_count: 6 } },
              { key: 'id8', filtered: { doc_count: 76 } },
            ],
          },
          property4: { buckets: [{ key: 'id36', filtered: { doc_count: 36 } }] },
        },
      },
    },
  },

  getAggregation: {
    dataset1: {
      aggregations: {
        all: {
          _types: {
            buckets: [
              { key: 'id1', filtered: { doc_count: 1 } },
              { key: 'id2', filtered: { doc_count: 25 } },
              { key: 'id3', filtered: { doc_count: 5.6 } },
              { key: 'id4', filtered: { doc_count: 7.8 } },
              { key: 'id5', filtered: { doc_count: 0 } },
            ],
          },
          property1: { buckets: [{ key: 'id3', filtered: { doc_count: 5 } }] },
        },
      },
    },

    dataset2: {
      aggregations: {
        all: {
          _types: {
            buckets: [
              { key: 'id5', filtered: { doc_count: 6 } },
              { key: 'id7', filtered: { doc_count: 76 } },
            ],
          },
          property4: { buckets: [{ key: 'id36', filtered: { doc_count: 36 } }] },
        },
      },
    },
  },

  getMetadataValue: {
    dataset1: {
      title: 'Entity 1',
      metadata: { progress: [{ value: '3.5' }], otherProperty: [{ value: '2' }] },
    },

    dataset2: {
      title: 'Entity 2',
      metadata: { progress: [{ value: '1.5' }], otherProperty: [{ value: '4' }] },
    },
  },
};
