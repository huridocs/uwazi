import db, { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

const templateIndexProblems = db.id();
const f = getFixturesFactory();

const fixtures: DBFixture = {
  entities: [
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems1',
      language: 'en',
      title: 'Entity with index Problems 1',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 1 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems2',
      language: 'en',
      title: 'Entity with index Problems 2',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 'text that will fail' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems3',
      language: 'en',
      title: 'Entity with index Problems 3',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 'another fail' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems4',
      language: 'en',
      title: 'Entity with index Problems 4',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 'fail on 4' }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems5',
      language: 'en',
      title: 'Entity with index Problems 5',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 2 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems6',
      language: 'en',
      title: 'Entity with index Problems 6',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 3 }] },
    },
    {
      _id: db.id(),
      sharedId: 'entityWithIndexProblems7',
      language: 'en',
      title: 'Entity with index Problems 7',
      published: true,
      template: templateIndexProblems,
      metadata: { text_field: [{ value: 4 }] },
    },
  ],
  templates: [
    f.template(
      'indexProblems',
      [{ _id: db.id(), name: 'text_field', label: 'text field', type: 'text', filter: true }],
      { _id: templateIndexProblems }
    ),
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
