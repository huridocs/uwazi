import Immutable from 'immutable';

export const doc = {
  template: 'templateID',
  title: 'Corte Interamericana de Derechos Humanos',
  creationDate: 0,
  metadata: {
    text: 'text content',
    date: 10,
    multiselect: ['value1', 'value2', 'value5'],
    multidate: [10, 1000000],
    daterange: { from: 10, to: 1000000 },
    multidaterange: [{ from: 10, to: 1000000 }, { from: 2000000, to: 3000000 }],
    markdown: 'markdown content',
    select: 'value3',
    relationship1: ['value1', 'value2'],
    relationship2: ['value1', 'value2', 'value4'],
    geolocation: { lat: 2, lon: 3 },
    nested: [],
    select2: ''
  }
};

export const templates = Immutable.fromJS([
  { _id: 'template' },
  { _id: 'template2' },
  {
    _id: 'templateID',
    name: 'Mecanismo',
    isEntity: true,
    properties: [
      { name: 'text', type: 'text', label: 'Text', showInCard: true },
      { name: 'date', type: 'date', label: 'Date' },
      { name: 'multiselect', content: 'thesauriId', type: 'multiselect', label: 'Multiselect' },
      { name: 'multidate', type: 'multidate', label: 'Multi Date' },
      { name: 'daterange', type: 'daterange', label: 'Date Range' },
      { name: 'multidaterange', type: 'multidaterange', label: 'Multi Date Range' },
      { name: 'markdown', type: 'markdown', label: 'Mark Down', showInCard: true },
      { name: 'select', content: 'thesauriId', type: 'select', label: 'Select' },
      { name: 'relationship1', type: 'relationship', label: 'Relationship', content: 'thesauriId', relationType: 'relationType1' },
      { name: 'relationship2', type: 'relationship', label: 'Relationship 2', content: null, relationType: 'relationType1' },
      { name: 'geolocation', type: 'geolocation', label: 'Geolocation', showInCard: true },
      { name: 'nested', type: 'nested', label: 'Nested' }
    ]
  }
]);

export const thesauris = Immutable.fromJS([
  {
    _id: 'thesauriId',
    name: 'Multiselect',
    type: 'template',
    values: [
      { label: 'Value 1', id: 'value1', _id: 'value1' },
      { label: 'Value 2', id: 'value2', _id: 'value2' },
      {
        label: 'Value 3',
        id: 'value3',
        _id: 'value3',
        values: [
          { label: 'Value 5', id: 'value5', _id: 'value5' },
          { label: 'Value 6', id: 'value6', _id: 'value6' },
        ] }
    ]
  },
  {
    _id: 'thesauriId2',
    name: 'Multiselect2',
    type: 'template',
    isEntity: true,
    values: [{ label: 'Value 4', id: 'value4', _id: 'value4' }]
  }
]);
