import db, { DBFixture } from 'api/utils/testing_db';

const templateIndexProblems = db.id();

const fixtures: DBFixture = {
  entities: [
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems1',
      language: 'en',
      title: 'Entity with index Problems 1',
      published: true,
      metadata: { text_field: [{ value: 1 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems2',
      language: 'en',
      title: 'Entity with index Problems 2',
      published: true,
      metadata: { text_field: [{ value: 'text that will fail' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems3',
      language: 'en',
      title: 'Entity with index Problems 3',
      published: true,
      metadata: { text_field: [{ value: 'another fail' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems4',
      language: 'en',
      title: 'Entity with index Problems 4',
      published: true,
      metadata: { text_field: [{ value: 'fail on 4' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems5',
      language: 'en',
      title: 'Entity with index Problems 5',
      published: true,
      metadata: { text_field: [{ value: 2 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems6',
      language: 'en',
      title: 'Entity with index Problems 6',
      published: true,
      metadata: { text_field: [{ value: 3 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems7',
      language: 'en',
      title: 'Entity with index Problems 7',
      published: true,
      metadata: { text_field: [{ value: 4 }] },
    },
  ],
  templates: [
    {
      _id: templateIndexProblems,
      properties: [{ _id: db.id(), name: 'text_field', type: 'text', filter: true }],
    },
  ],
  settings: [
    {
      languages: [
        { key: 'en', label: 'EN', default: true },
        { key: 'es', label: 'ES' },
      ],
    },
  ],
};

export { fixtures };
