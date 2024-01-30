import db from 'api/utils/testing_db';

const fixturesDB = {
  settings: [{ _id: db.id(), languages: [{ key: 'en' }, { key: 'es' }] }],
  translationsV2: [
    {
      _id: db.id(),
      language: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Match / Label',
      value: 'Match / Label',
    },
    {
      _id: db.id(),
      language: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Reviewing',
      value: 'Reviewing',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Match / Label',
      value: 'Match / Label',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Reviewing',
      value: 'Reviewing',
    },
    {
      _id: db.id(),
      language: 'en',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Im cool',
      value: 'Im cool',
    },
    {
      _id: db.id(),
      language: 'es',
      context: { id: 'System', label: 'User Interface', type: 'Uwazi UI' },
      key: 'Im cool',
      value: 'Im cool',
    },
  ],
};

export default fixturesDB;
