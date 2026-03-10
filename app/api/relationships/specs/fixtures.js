/** @format */

/* eslint-disable */
import db from 'api/utils/testing_db';
const connectionID1 = db.id();
const connectionID2 = db.id();
const connectionID3 = db.id();
const connectionID4 = db.id();
const connectionID5 = db.id();
const connectionID6 = db.id();
const connectionID7 = db.id();
const connectionID8 = db.id();
const connectionID9 = db.id();

const entity3 = db.id();

const inbound = db.id();
const template = db.id();
const thesauri = db.id();
const templateWithoutProperties = db.id();
const selectValueID = db.id().toString();
const value1ID = db.id().toString();
const value2ID = db.id().toString();
const templateChangingNames = db.id();
const relation1 = db.id();
const relation2 = db.id();
const friend = db.id();
const family = db.id();

const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();
const hub4 = db.id();
const hub5 = db.id();
const hub6 = db.id();
const hub7 = db.id();
const hub8 = db.id();
const hub9 = db.id();
const hub10 = db.id();
const hub11 = db.id();
const hub12 = db.id();

const sharedId1 = db.id();
const sharedId2 = db.id();
const sharedId3 = db.id();
const sharedId4 = db.id();
const sharedId7 = db.id();

export default {
  connections: [
    { entity: 'entity1', hub: hub1 },
    { entity: 'entity2', hub: hub1, template: relation1, file: 'file1' },

    { _id: connectionID5, entity: 'entity3', hub: hub2, template: relation2 },
    { _id: connectionID8, entity: 'entity2', hub: hub2, template: relation2, file: 'file2' },
    { _id: connectionID9, entity: 'entity3', hub: hub2 },

    { entity: 'entity2', hub: hub3, template: relation2 },
    { entity: 'doc4', hub: hub3, template: relation2 },
    { entity: 'missingEntity', hub: hub3, template: relation2 },

    { entity: 'entity2', hub: hub4, template: relation1 },
    { entity: 'doc5', hub: hub4, template: relation1 },
    { entity: 'entity3', hub: hub4, template: relation1 },

    { entity: 'target', hub: hub5 },
    { entity: 'doc5', hub: hub5, range: {}, filename: 'doc5enFile' },
    { entity: 'target', hub: hub5 },

    { entity: 'target1', hub: hub6 },

    { _id: connectionID1, entity: 'entity_id', hub: hub7, template: relation1 },
    { _id: connectionID2, entity: 'another_id', hub: hub7, template: relation1 },
    { _id: connectionID3, entity: 'document_id', range: { end: 1 }, hub: hub7 },
    { entity: value2ID, hub: hub7, range: 'range1', template: relation1 },

    { _id: inbound, entity: value2ID, hub: hub8 },
    { entity: 'entity_id', hub: hub8 },
    { entity: 'entity_id', hub: hub8 },
    { hub: hub8, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2enFile' },
    { hub: hub8, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2ptFile' },

    { entity: 'bruceWayne', hub: hub9 },
    { entity: 'thomasWayne', hub: hub9, template: family },
    { entity: 'IHaveNoTemplate', hub: hub9, template: null },
    { hub: hub9, entity: 'doc2' },

    { _id: connectionID6, entity: 'entity2', hub: hub11, template: relation2 },
    { _id: connectionID7, entity: 'entity3', hub: hub11 },

    {
      hub: hub12,
      _id: connectionID4,
      entity: 'doc1',
      range: { end: 5, text: 'not empty' },
      filename: 'doc1enFile',
    },
    { hub: hub12, entity: 'entity1' },
    { hub: hub12, entity: 'doc2', range: { end: 9, text: 'another text' }, filename: 'doc2enFile' },
  ],
  templates: [
    { _id: templateWithoutProperties },
    {
      _id: template,
      name: 'template',
      properties: [
        {
          name: 'friend',
          type: 'relationship',
          label: 'friend',
          relationType: friend.toString(),
        },
        {
          name: 'family',
          type: 'relationship',
          label: 'family',
          relationType: family.toString(),
        },
        {
          name: 'dictionarySelect',
          type: 'select',
          content: thesauri,
        },
        {
          name: 'dictionaryMultiSelect',
          type: 'multiselect',
          content: thesauri,
        },
        {
          name: 'otherName',
          type: 'other',
        },
      ],
    },
    {
      _id: templateChangingNames,
      name: 'template_changing_names',
      properties: [
        { id: '1', type: 'text', name: 'property1' },
        { id: '2', type: 'text', name: 'property2' },
        { id: '3', type: 'text', name: 'property3' },
      ],
    },
  ],
  entities: [
    {
      sharedId: 'doc1',
      language: 'en',
      title: 'doc1 en title',
      type: 'document',
      template: template,
      file: { filename: 'doc1enFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc1',
      language: 'pt',
      title: 'doc1 pt title',
      type: 'document',
      template: template,
      file: { filename: 'doc1ptFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc1',
      language: 'es',
      title: 'doc1 es title',
      type: 'document',
      template: template,
      file: { filename: 'doc1enFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc2',
      language: 'en',
      title: 'doc2 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc2enFile' },
    },
    {
      sharedId: 'doc2',
      language: 'pt',
      title: 'doc2 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc2ptFile' },
    },
    {
      sharedId: 'doc2',
      language: 'es',
      title: 'doc2 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc2esFile' },
    },

    {
      sharedId: 'entity1',
      language: 'en',
      title: 'entity1 title',
      file: {},
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data1' }] },
      creationDate: 123,
    },
    {
      sharedId: 'entity1',
      language: 'es',
      title: 'entity1 title',
      file: {},
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data1' }] },
      creationDate: 123,
    },
    {
      sharedId: 'entity1',
      language: 'pt',
      title: 'entity1 title',
      file: {},
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data1' }] },
      creationDate: 123,
    },
    {
      sharedId: 'entity2',
      language: 'en',
      title: 'entity2 title',
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 123,
    },
    {
      sharedId: 'entity2',
      language: 'es',
      title: 'entity2 title',
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 123,
    },
    {
      sharedId: 'entity2',
      language: 'pt',
      title: 'entity2 title',
      type: 'document',
      template: template,
      icon: 'icon1',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 123,
    },
    {
      _id: entity3,
      sharedId: 'entity3',
      language: 'en',
      title: 'entity3 title',
      type: 'entity',
      template: template,
      published: true,
      icon: 'icon3',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 456,
    },
    {
      sharedId: 'entity3',
      language: 'ru',
      title: 'entity3 title',
      type: 'entity',
      template: template,
      published: true,
      icon: 'icon3',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 456,
    },
    {
      sharedId: 'entity4',
      language: 'en',
      title: 'entity4 title',
      type: 'entity',
      template: template,
      published: true,
      icon: 'icon3',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 456,
    },
    {
      sharedId: 'entity4',
      language: 'ru',
      title: 'entity4 title',
      type: 'entity',
      template: template,
      published: true,
      icon: 'icon3',
      metadata: { data: [{ value: 'data2' }] },
      creationDate: 456,
    },
    {
      sharedId: 'doc4',
      language: 'en',
      title: 'doc4 en title',
      type: 'document',
      template: template,
      file: { filename: 'doc4enFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc4',
      language: 'pt',
      title: 'doc4 pt title',
      type: 'document',
      template: template,
      file: { filename: 'doc4ptFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc4',
      language: 'es',
      title: 'doc4 es title',
      type: 'document',
      template: template,
      file: { filename: 'doc4enFile' },
      metadata: { data: [{ value: 'data3' }] },
      creationDate: 789,
    },
    {
      sharedId: 'doc5',
      language: 'en',
      title: 'doc5 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc5enFile' },
    },
    {
      sharedId: 'doc5',
      language: 'es',
      title: 'doc5 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc5enFile' },
    },
    {
      sharedId: 'doc5',
      language: 'pt',
      title: 'doc5 title',
      type: 'document',
      template: template,
      published: true,
      file: { filename: 'doc5enFile' },
    },
    { sharedId: selectValueID, language: 'en', title: 'selectValue', type: 'entity' },
    { sharedId: value1ID, language: 'en', title: 'value1', type: 'entity' },
    { sharedId: value2ID, language: 'en', title: 'value2', type: 'entity', template },
    { sharedId: value2ID, language: 'pt', title: 'value2', type: 'entity', template },
    { sharedId: 'bruceWayne', language: 'en', title: 'bruceWayne', type: 'entity', template },
    { sharedId: 'bruceWayne', language: 'pt', title: 'bruceWayne', type: 'entity', template },
    { sharedId: 'thomasWayne', language: 'en', title: 'thomasWayne', type: 'entity', template },
    { sharedId: 'thomasWayne', language: 'pt', title: 'thomasWayne', type: 'entity', template },
    { sharedId: 'alfred', language: 'en', title: 'alfred', type: 'entity', template },
    { sharedId: 'robin', language: 'en', title: 'robin', type: 'entity', template },
    { sharedId: 'IHaveNoTemplate', language: 'en', title: 'no template', type: 'entity', template },
    { sharedId: 'IHaveNoTemplate', language: 'pt', title: 'no template', type: 'entity', template },
    { sharedId: 'entity_id', language: 'en', title: 'en entity', type: 'entity', template },
    { sharedId: 'entity_id', language: 'pt', title: 'en entity', type: 'entity', template },
  ],
  dictionaries: [{ _id: thesauri }],
  relationtypes: [
    {
      _id: relation1,
      name: 'relation 1',
      properties: [
        { type: 'text', name: 'title' },
        { type: 'multiselect', name: 'options' },
        { type: 'date', name: 'date' },
      ],
    },
    { _id: relation2, name: 'relation 2' },
    { _id: friend, name: 'friend' },
    { _id: family, name: 'family' },
  ],

  settings: [{ languages: [{ key: 'en' }, { key: 'es' }] }],
};

export {
  template,
  inbound,
  connectionID1,
  connectionID2,
  connectionID3,
  connectionID4,
  connectionID5,
  connectionID6,
  connectionID7,
  connectionID8,
  connectionID9,
  entity3,
  selectValueID,
  value1ID,
  value2ID,
  templateChangingNames,
  templateWithoutProperties,
  relation1,
  relation2,
  hub1,
  hub2,
  hub3,
  hub4,
  hub5,
  hub6,
  hub7,
  hub8,
  hub9,
  hub10,
  hub11,
  hub12,
  family,
  friend,
  sharedId2,
  sharedId3,
  sharedId4,
  sharedId7,
};
