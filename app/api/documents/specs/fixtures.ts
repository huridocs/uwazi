/* eslint-disable */
import { testingDB as db, DBFixture } from 'api/utils/testing_db';

const batmanFinishesId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const referenceId = db.id();
const document1 = db.id();

export const fixtures: DBFixture = {
  files: [
    {
      _id: document1,
      fullText: {
        1: 'page[[1]] 1[[1]]',
        2: 'page[[2]] 2[[2]]',
      },
    },
    {
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014cc1.pdf',
      originalname: 'Batman original.jpg',
      type: 'document',
    },
    { entity: 'shared', filename: '8202c463d6158af8065022d9b5014ccb.pdf', type: 'document' },
    { entity: 'shared', filename: '8202c463d6158af8065022d9b5014ccc.pdf', type: 'attachment' },
  ],
  entities: [
    {
      _id: batmanFinishesId,
      sharedId: 'shared',
      template: templateId,
      language: 'en',
      title: 'Batman finishes',
      published: true,
      user: 'username',
    },
    {
      _id: db.id(),
      sharedId: 'shared',
      language: 'es',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
      user: 'username',
      file: { filename: '8202c463d6158af8065022d9b5014ccb.pdf', fullText: 'fullText' },
    },
    {
      _id: db.id(),
      sharedId: 'shared',
      language: 'pt',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'test' }] },
      user: 'username',
    },
    //select/multiselect/date sync
    {
      _id: syncPropertiesEntityId,
      template: templateId,
      sharedId: 'shared1',
      language: 'en',
      title: 'EN',
      published: true,
      metadata: { text: [{ value: 'text' }] },
      user: 'username',
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      language: 'es',
      title: 'ES',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'text' }] },
      user: 'username',
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      language: 'pt',
      title: 'PT',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'text' }] },
      user: 'username',
    },
  ],
  settings: [
    {
      _id: db.id(),
      languages: [
        { key: 'es', label: 'ES' },
        { key: 'pt', label: 'PT' },
        { key: 'en', label: 'EN', default: true },
      ],
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'template_test',
      properties: [
        { type: 'text', name: 'text' },
        { type: 'select', name: 'select' },
        { type: 'multiselect', name: 'multiselect' },
        { type: 'date', name: 'date' },
        { type: 'multidate', name: 'multidate' },
        { type: 'multidaterange', name: 'multidaterange' },
      ],
    },
  ],
  connections: [
    {
      _id: referenceId,
      title: 'reference1',
      sourceDocument: 'shared',
      template: 'relation1',
    },
    {
      _id: db.id(),
      title: 'reference2',
      sourceDocument: 'source2',
      template: 'relation2',
      targetDocument: 'shared',
    },
    {
      _id: db.id(),
      title: 'reference3',
      sourceDocument: 'another',
      template: 'relation3',
      targetDocument: 'document',
    },
  ],
};

export { batmanFinishesId, syncPropertiesEntityId, templateId, document1 };
