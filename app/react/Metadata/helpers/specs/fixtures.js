import Immutable from 'immutable';

export const doc = {
  _id: 'languageSpecificId',
  template: 'templateID',
  title: 'Corte Interamericana de Derechos Humanos',
  creationDate: 0,
  file: {
    filename: 'filename.pdf'
  },
  metadata: {
    text: 'text content',
    date: 10,
    multiselect: ['value1', 'value2', 'value5'],
    multidate: [10, 1000000],
    daterange: { from: 10, to: 1000000 },
    multidaterange: [{ from: 10, to: 1000000 }, { from: 2000000, to: 3000000 }],
    markdown: 'markdown content',
    select: 'value3',
    image: 'imageURL',
    media: 'mediaURL',
    relationship1: [{ entity: 'value1' }, { entity: 'value2' }],
    relationship2: [{ entity: 'value1' }, { entity: 'value2' }, { entity: 'value4' }],
    relationship3: [
      { entity: 'value1', inherit_string: 'how' },
      { entity: 'value2', inherit_string: 'are' },
      { entity: 'value4', inherit_string: 'you?' }
    ],
    geolocation: [{ lat: 2, lon: 3 }, { lat: 13, lon: 7, label: 'home' }],
    nested: [{ nestedKey: [1, 2] }, { nestedKey: [3, 4] }],
    select2: ''
  }
};

export const templates = Immutable.fromJS([
  { _id: 'template' },
  {
    _id: 'template2',
    properties: [
      { name: 'text', type: 'text' }
    ]
  },
  {
    _id: 'templateID',
    name: 'Mecanismo',
    properties: [
      { name: 'text', type: 'text', label: 'Text', showInCard: true },
      { name: 'date', type: 'date', label: 'Date' },
      { name: 'multiselect', content: 'thesauriId', type: 'multiselect', label: 'Multiselect' },
      { name: 'multidate', type: 'multidate', label: 'Multi Date' },
      { name: 'daterange', type: 'daterange', label: 'Date Range' },
      { name: 'multidaterange', type: 'multidaterange', label: 'Multi Date Range' },
      { name: 'markdown', type: 'markdown', label: 'Mark Down', showInCard: true },
      { name: 'select', content: 'thesauriId', type: 'select', label: 'Select' },
      { name: 'image', type: 'image', label: 'Image', showInCard: true, noLabel: true, style: 'cover' },
      { name: 'preview', type: 'preview', label: 'PDFPreview', showInCard: true, noLabel: false, style: 'contain' },
      { name: 'media', type: 'media', label: 'Media', showInCard: true, noLabel: false },
      { name: 'relationship1', type: 'relationship', label: 'Relationship', content: 'thesauriId', relationType: 'relationType1' },
      { name: 'relationship2', type: 'relationship', label: 'Relationship 2', content: null, relationType: 'relationType1' },
      { name: 'relationship3', inherit: true, inheritProperty: 'text', type: 'relationship', label: 'Relationship 3', content: 'template2', relationType: 'relationType1' },
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
      { label: 'Value 1', id: 'value1', _id: 'value1', type: 'document' },
      { label: 'Value 2', id: 'value2', _id: 'value2', type: 'document' },
      {
        label: 'Value 3',
        id: 'value3',
        _id: 'value3',
        values: [
          { label: 'Value 5', id: 'value5', _id: 'value5', type: 'document' },
          { label: 'Value 6', id: 'value6', _id: 'value6', type: 'document' },
        ] }
    ]
  },
  {
    _id: 'thesauriId2',
    name: 'Multiselect2',
    type: 'template',
    values: [{ label: 'Value 4', id: 'value4', _id: 'value4', type: 'entity' }]
  }
]);
