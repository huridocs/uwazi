import db from 'api/utils/testing_db';

const system = {
  label: 'System',
  type: 'Uwazi UI',
  id: 'System',
  values: [
    { key: 'Delete User', value: 'Delete User' },
    { key: 'Menu', value: 'Menu' },
    { key: 'Save User', value: 'Save User' },
    { key: 'Create User', value: 'Create User' },
    { key: 'Filters', value: 'Filters' },
    { key: 'Library', value: 'Library' },
  ],
};

const thesauri = {
  label: 'Colors',
  type: 'Thesaurus',
  id: db.id(),
  values: [
    { key: 'red', value: 'Red' },
    { key: 'green', value: 'Green' },
    { key: 'blue', value: 'Blue' },
  ],
};

export default {
  translations: [
    {
      locale: 'en',
      contexts: [system, thesauri],
    },
    {
      locale: 'es',
      contexts: [system, thesauri],
    },
    {
      locale: 'fr',
      contexts: [system, thesauri],
    },
  ],
};
