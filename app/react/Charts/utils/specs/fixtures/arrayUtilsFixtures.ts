import Immutable from 'immutable';

const aggregationWithNestedValues = Immutable.fromJS([
  {
    key: 'd2ieurwgjv',
    doc_count: 4,
    filtered: {
      doc_count: 4,
    },
    label: 'Nest A',
    values: [
      {
        key: 'zlel1nllvs',
        doc_count: 0,
        filtered: {
          doc_count: 0,
        },
        label: 'A1',
      },
      {
        key: '7pu7fcxl8eg',
        doc_count: 1,
        filtered: {
          doc_count: 1,
        },
        label: 'A2',
      },
      {
        key: 'ipqlonrw89k',
        doc_count: 3,
        filtered: {
          doc_count: 3,
        },
        label: 'A3',
      },
    ],
  },
  {
    key: '533lf50cam',
    doc_count: 1,
    filtered: {
      doc_count: 1,
    },
    label: 'Nest B',
    values: [
      {
        key: 'jpw985bxwwg',
        doc_count: 1,
        filtered: {
          doc_count: 1,
        },
        label: 'B1',
      },
      {
        key: 'cbe3spt1k8o',
        doc_count: 0,
        filtered: {
          doc_count: 0,
        },
        label: 'B2',
      },
    ],
  },
]);

const expectNestedResult = [
  {
    id: 'zlel1nllvs',
    label: 'A1',
    parent: 'Nest A',
    results: 0,
  },
  {
    id: '7pu7fcxl8eg',
    label: 'A2',
    parent: 'Nest A',
    results: 1,
  },
  {
    id: 'ipqlonrw89k',
    label: 'A3',
    parent: 'Nest A',
    results: 3,
  },
  {
    id: 'jpw985bxwwg',
    label: 'B1',
    parent: 'Nest B',
    results: 1,
  },
  {
    id: 'cbe3spt1k8o',
    label: 'B2',
    parent: 'Nest B',
    results: 0,
  },
];

const expectNestedResultWithNoZeros = [
  {
    id: '7pu7fcxl8eg',
    label: 'A2',
    parent: 'Nest A',
    results: 1,
  },
  {
    id: 'ipqlonrw89k',
    label: 'A3',
    parent: 'Nest A',
    results: 3,
  },
  {
    id: 'jpw985bxwwg',
    label: 'B1',
    parent: 'Nest B',
    results: 1,
  },
];

export { aggregationWithNestedValues, expectNestedResult, expectNestedResultWithNoZeros };
