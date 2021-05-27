import db, { DBFixture } from 'api/utils/testing_db';

const templateId = db.id();

const fixtures: DBFixture = {
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
      language: 'pr',
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

export { fixtures, templateId };
