import db from 'api/utils/testing_db';

export default {
  pages: [
    {
      _id: db.id(),
      sharedId: '1',
      language: 'es',
      title: 'Batman finishes',
      user: { username: 'user' },
    },
    {
      _id: db.id(),
      sharedId: '2',
      language: 'es',
      title: 'Penguin almost done',
      creationDate: 1,
      user: { username: 'user' },
    },
    {
      _id: db.id(),
      sharedId: '2',
      language: 'pt',
      title: 'Right there',
      user: { username: 'user' },
    },
  ],

  settings: [{ _id: db.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }] }],
};
