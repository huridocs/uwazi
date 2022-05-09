import db, { DBFixture } from 'api/utils/testing_db';

const templateId = db.id();
const textPropertyId = db.id();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'En', default: true },
        { key: 'es', label: 'ES' },
        { key: 'pt', label: 'PT' },
      ],
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'template',
      commonProperties: [{ _id: db.id(), name: 'title', label: 'title', type: 'text' }],
      properties: [{ _id: textPropertyId, name: 'text', type: 'text', label: 'Text' }],
    },
  ],
  entities: [
    {
      _id: db.id(),
      title: 'entity1 es',
      sharedId: 'ent1',
      language: 'es',
      published: false,
      template: templateId,
      metadata: { text: [{ value: 'test' }] },
    },
    {
      _id: db.id(),
      title: 'entity1 en',
      sharedId: 'ent1',
      language: 'en',
      published: false,
      template: templateId,
      metadata: { text: [{ value: 'test' }] },
    },
    {
      _id: db.id(),
      title: 'entity2 es',
      sharedId: 'ent2',
      language: 'es',
      published: false,
      template: templateId,
      metadata: { text: [{ value: 'test' }] },
    },
    {
      _id: db.id(),
      title: 'entity2 pr',
      sharedId: 'ent2',
      language: 'pt',
      published: false,
      template: templateId,
      metadata: { text: [{ value: 'test' }] },
    },
    {
      _id: db.id(),
      title: 'entity3 en',
      sharedId: 'ent3',
      language: 'en',
      published: false,
      template: db.id(),
      metadata: { text: [{ value: 'test' }] },
    },
  ],
};

export { fixtures, templateId, textPropertyId };
