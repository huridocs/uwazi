import db from 'api/utils/testing_db';

const fixturesDB = {
  settings: [{ _id: db.id(), languages: [{ key: 'en' }, { key: 'es' }] }],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Match / Label',
      value: 'Match / Label',
    },
    {
      _id: db.id(),
      locale: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Reviewing',
      value: 'Reviewing',
    },
  ],
};

export default fixturesDB;
