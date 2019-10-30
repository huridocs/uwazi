/** @format */

import Immutable from 'immutable';

export const doc = {
  _id: 'languageSpecificId',
  template: 'templateID',
  title: 'Rude awakening',
  creationDate: 0,
  file: {
    filename: 'filename.pdf',
  },
  metadata: {
    text: [{ value: 'text content' }],
    date: [{ value: 10 }],
    multiselect: [
      { value: 'value1', label: 'Value 1' },
      { value: 'value2', label: 'Value 2' },
      { value: 'value5', label: 'Value 5' },
    ],
    multidate: [{ value: 10 }, { value: 1000000 }],
    daterange: [{ value: { from: 10, to: 1000000 } }],
    multidaterange: [
      { value: { from: 10, to: 1000000 } },
      { value: { from: 2000000, to: 3000000 } },
    ],
    markdown: [{ value: 'markdown content' }],
    select: [{ value: 'value5', label: 'Value 5' }],
    image: [{ value: 'imageURL' }],
    media: [{ value: 'mediaURL' }],
    relationship1: [{ value: 'value1', label: 'Value 1' }, { value: 'value2', label: 'Value 2' }],
    relationship2: [
      { value: 'value1', label: 'Value 1' },
      { value: 'value2', label: 'Value 2' },
      { value: 'value4', label: 'Value 4' },
    ],
    relationship3: [
      { value: 'value1', label: 'Value 1' },
      { value: 'value2', label: 'Value 2' },
      { value: 'value3', label: 'Value 3' },
    ],
    relationship4: [
      { value: 'linkedEntity1', label: 'Entity 1 Title' },
      { value: 'linkedEntity2', label: 'Entity 2 Title' },
      { value: 'linkedEntityWithoutMetadata' },
    ],
    geolocation: [{ value: { lat: 2, lon: 3 } }, { value: { lat: 13, lon: 7, label: 'home' } }],
    nested: [{ value: { nestedKey: [1, 2] } }, { value: { nestedKey: [3, 4] } }],
    select2: [],
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
  { entity: 'linkedEntityWithoutMetadata', entityData: {} },
]);

export const templates = Immutable.fromJS([
  { _id: 'template' },
  {
    _id: 'template2',
    properties: [
      { _id: '123', name: 'text', type: 'text' },
      { _id: '456', name: 'home_geolocation', type: 'geolocation' },
    ],
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
        inherit: true,
        inheritProperty: '123',
        type: 'relationship',
        label: 'Relationship 3',
        content: 'template2',
        relationType: 'relationType1',
      },
      {
        name: 'relationship4',
        inherit: true,
        inheritProperty: '456',
        type: 'relationship',
        label: 'Relationship 4',
        content: 'template2',
        relationType: 'relationType2',
      },
      { name: 'geolocation', type: 'geolocation', label: 'Geolocation', showInCard: true },
      { name: 'nested', type: 'nested', label: 'Nested' },
    ],
  },
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
        ],
      },
    ],
  },
  {
    _id: 'thesauriId2',
    name: 'Multiselect2',
    type: 'template',
    values: [{ label: 'Value 4', id: 'value4', _id: 'value4', type: 'entity' }],
  },
  {
    _id: 'template2',
    name: 'Geolocations',
    type: 'template',
    values: [
      { label: 'Entity 1 Title', id: 'linkedEntity1', _id: 'linkedEntity1', type: 'entity' },
      { label: 'Entity 2 Title', id: 'linkedEntity2', _id: 'linkedEntity2', type: 'entity' },
    ],
  },
]);
