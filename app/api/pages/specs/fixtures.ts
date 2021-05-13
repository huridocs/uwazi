import db, { DBFixture } from 'api/utils/testing_db';

export const pageToUpdate = db.id();

export const fixtures: DBFixture = {
  pages: [
    {
      _id: db.id(),
      sharedId: '1',
      language: 'es',
      title: 'Batman finishes',
      user: 'user',
      entityView: true,
    },
    {
      _id: db.id(),
      sharedId: '1',
      language: 'en',
      title: 'Batman finishes',
      user: 'user',
    },
    {
      _id: pageToUpdate,
      sharedId: '2',
      language: 'es',
      title: 'Penguin almost done',
      creationDate: 1,
      user: 'user',
    },
    {
      _id: db.id(),
      sharedId: '2',
      language: 'fr',
      title: 'Right there',
      user: 'user',
    },
  ],

  settings: [
    { _id: db.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }] },
  ],
  templates: [
    {
      _id: db.id(),
      title: 'Template with custom page 1',
      entityViewPage: '1',
    },
    {
      _id: db.id(),
      title: 'Template with custom page 2',
      entityViewPage: '1',
    },
  ],
};
