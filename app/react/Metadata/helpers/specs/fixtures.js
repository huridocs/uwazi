import Immutable from 'immutable';

const entityDocs = [{ _id: 'doc1' }, { _id: 'doc2' }];

export const doc = {
  _id: 'languageSpecificId',
  template: 'templateID',
  title: 'Rude awakening',
  creationDate: 0,
  editDate: 0,
  file: {
    filename: 'filename.pdf',
  },
  defaultDoc: entityDocs[1],
  documents: entityDocs,
  metadata: {
    text: [{ value: 'text content' }],
    date: [{ value: 10 }],
    multiselect: [
      { value: 'value1', label: 'Value 1' },
      { value: 'value2', label: 'Value 2' },
      { value: 'value5', label: 'Value 5', parent: { value: 'parent1', label: 'Parent 1' } },
      { value: 'value6', label: 'Value 6', parent: { value: 'parent1', label: 'Parent 1' } },
      { value: 'value7', label: 'Value 7', parent: { value: 'parent2', label: 'Parent 2' } },
    ],
    multidate: [{ value: 10 }, { value: 1000000 }],
    daterange: [{ value: { from: 10, to: 1000000 } }],
    multidaterange: [
      { value: { from: 10, to: 1000000 } },
      { value: { from: 2000000, to: 3000000 } },
    ],
    markdown: [{ value: 'markdown content' }],
    select: [{ value: 'value5', label: 'Value 5' }],
    selectWithCategory: [
      { value: 'value5', label: 'Value 5', parent: { value: 'parent1', label: 'Parent 1' } },
    ],
    image: [{ value: 'imageURL' }],
    media: [{ value: 'mediaURL' }],
    relationship1: [
      { type: 'document', value: 'value1', label: 'Value 1' },
      { type: 'document', value: 'value2', label: 'Value 2' },
    ],
    relationship2: [
      { type: 'document', value: 'value1', label: 'Value 1' },
      { type: 'document', value: 'value2', label: 'Value 2' },
      { type: 'entity', value: 'value4', label: 'Value 4' },
    ],
    relationship3: [
      { value: 'value1', label: 'Value 1', inheritedValue: [{ value: 'how' }] },
      { value: 'value2', label: 'Value 2', inheritedValue: [{ value: 'are' }] },
      { value: 'value3', label: 'Value 3', inheritedValue: [{ value: 'you?' }] },
    ],
    relationship4: [
      {
        value: 'linkedEntity1',
        label: 'Entity 1 Title',
        inheritedValue: [{ value: { lat: 13, lon: 7 } }],
      },
      {
        value: 'linkedEntityWithoutGeolocationValue',
        label: 'Entity without value',
        inheritedValue: null,
      },
      {
        value: 'linkedEntity2',
        label: 'Entity 2 Title',
        inheritedValue: [{ value: { lat: 5, lon: 10, label: 'exisitng label' } }],
      },
      {
        value: 'linkedEntityWithoutMetadata',
        label: 'Entity 2 Title',
        inheritedValue: [{ value: { lat: 23, lon: 8, label: 'another label' } }],
      },
    ],
    relationship5: [
      {
        value: 'linkedEntity_multiselect_1',
        label: 'Linked Entity With Multiselect 1 Title',
        inheritedValue: [
          { value: 'value1', label: 'Value 1' },
          { value: 'value5', label: 'Value 5', parent: { value: 'parent1', label: 'Parent 1' } },
        ],
      },
      {
        value: 'linkedEntity_multiselect_2',
        label: 'Linked Entity With Multiselect 2 Title',
        inheritedValue: [
          { value: 'value2', label: 'Value 2' },
          { value: 'value6', label: 'Value 6', parent: { value: 'parent1', label: 'Parent 1' } },
          { value: 'value7', label: 'Value 7', parent: { value: 'parent2', label: 'Parent 2' } },
        ],
      },
    ],
    geolocation: [{ value: { lat: 2, lon: 3 } }, { value: { lat: 13, lon: 7, label: 'home' } }],
    nested: [{ value: { nestedKey: [1, 2] } }, { value: { nestedKey: [3, 4] } }],
    select2: [],
    link: [{ value: { label: 'link label', url: 'link url' } }],
  },
};

export const relationships = Immutable.fromJS([
  { entity: 'value1', entityData: { metadata: { text: [{ value: 'how' }] } } },
  { entity: 'value2', entityData: { metadata: { text: [{ value: 'are' }] } } },
  { entity: 'value3', entityData: { metadata: { text: [{ value: 'you?' }] } } },
  {
    entity: 'linkedEntity1',
    entityData: { metadata: { home_geolocation: [{ value: { lat: 13, lon: 7, label: '' } }] } },
  },
  {
    entity: 'linkedEntity2',
    entityData: {
      metadata: {
        home_geolocation: [
          { value: { lat: 5, lon: 10, label: 'exisitng label' } },
          { value: { lat: 23, lon: 8, label: 'another label' } },
        ],
      },
    },
  },
  {
    entity: 'linkedEntity_multiselect_1',
    entityData: {
      metadata: {
        multiselect_source: [
          { value: 'value1', label: 'Value 1' },
          { value: 'value5', label: 'Value 5', parent: { value: 'parent1', label: 'Parent 1' } },
        ],
      },
    },
  },
  {
    entity: 'linkedEntity_multiselect_2',
    entityData: {
      metadata: {
        multiselect_source: [
          { value: 'value2', label: 'Value 2' },
          { value: 'value6', label: 'Value 6', parent: { value: 'parent1', label: 'Parent 1' } },
          { value: 'value7', label: 'Value 7', parent: { value: 'parent2', label: 'Parent 2' } },
        ],
      },
    },
  },
  { entity: 'linkedEntityWithoutMetadata', entityData: {} },
]);

export const templates = Immutable.fromJS([
  { _id: 'template' },
  {
    _id: 'template2',
    properties: [
      { _id: '123', name: 'text', type: 'text' },
      { _id: '456', name: 'home_geolocation', type: 'geolocation' },
      { _id: '789', name: 'multiselect_source', type: 'multiselect' },
    ],
  },
  {
    _id: 'templateID',
    name: 'Mecanismo',
    properties: [
      { name: 'text', type: 'text', label: 'Text', showInCard: true },
      { name: 'date', type: 'date', label: 'Date' },
      {
        name: 'multiselect',
        content: 'thesauriId',
        type: 'multiselect',
        label: 'Multiselect',
      },
      { name: 'multidate', type: 'multidate', label: 'Multi Date' },
      { name: 'daterange', type: 'daterange', label: 'Date Range' },
      { name: 'multidaterange', type: 'multidaterange', label: 'Multi Date Range' },
      { name: 'markdown', type: 'markdown', label: 'Mark Down', showInCard: true },
      { name: 'select', content: 'thesauriId', type: 'select', label: 'Select' },
      {
        name: 'selectWithCategory',
        content: 'thesauriId',
        type: 'select',
        label: 'selectWithCategory',
      },
      {
        name: 'image',
        type: 'image',
        label: 'Image',
        showInCard: true,
        noLabel: true,
        style: 'cover',
      },
      {
        name: 'preview',
        type: 'preview',
        label: 'PDFPreview',
        showInCard: true,
        noLabel: false,
        style: 'contain',
      },
      { name: 'media', type: 'media', label: 'Media', showInCard: true, noLabel: false },
      {
        name: 'relationship1',
        type: 'relationship',
        label: 'Relationship',
        content: 'thesauriId',
        relationType: 'relationType1',
      },
      {
        name: 'relationship2',
        type: 'relationship',
        label: 'Relationship 2',
        content: null,
        relationType: 'relationType1',
      },
      {
        name: 'relationship3',
        inherit: { property: '123', type: 'text' },
        type: 'relationship',
        label: 'Relationship 3',
        content: 'template2',
        relationType: 'relationType1',
      },
      {
        name: 'relationship4',
        inherit: { property: '456', type: 'geolocation' },
        type: 'relationship',
        label: 'Relationship 4',
        content: 'template2',
        relationType: 'relationType2',
      },
      {
        name: 'relationship5',
        inherit: { property: '789', type: 'multiselect' },
        type: 'relationship',
        label: 'Relationship 5',
        content: 'template2',
        relationType: 'relationType3',
      },
      { name: 'geolocation', type: 'geolocation', label: 'Geolocation', showInCard: true },
      { name: 'nested', type: 'nested', label: 'Nested' },
      {
        nestedProperties: [],
        label: 'Link',
        type: 'link',
        showInCard: true,
        name: 'link',
      },
    ],
  },
]);

export const thesauris = Immutable.fromJS([
  {
    _id: 'thesauriId',
    name: 'Multiselect',
    type: 'template',
    values: [],
  },
  {
    _id: 'thesauriId2',
    name: 'Multiselect2',
    type: 'template',
    values: [],
  },
  {
    _id: 'template2',
    name: 'Geolocations',
    type: 'template',
    values: [],
  },
]);
