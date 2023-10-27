import db from 'api/utils/testing_db';

const system = {
  _id: db.id(),
  label: 'System',
  type: 'Uwazi UI',
  id: 'System',
  values: [
    { key: 'Menu', value: 'Menu' },
    { key: 'Filters', value: 'Filters' },
    { key: 'Library', value: 'Library' },
    {
      key: 'Languages installed successfully',
      value: 'Languages installed successfully',
    },
    {
      key: 'Language uninstalled success',
      value: 'Language uninstalled success',
    },
  ],
};

const thesauri = {
  _id: db.id(),
  label: 'Colors',
  type: 'Thesaurus',
  id: 'thesaurus',
  values: [
    { key: 'red', value: 'Red' },
    { key: 'green', value: 'Green' },
    { key: 'blue', value: 'Blue' },
  ],
};

const translations = [
  {
    _id: db.id(),
    locale: 'en',
    contexts: [system, thesauri],
  },
  {
    _id: db.id(),
    locale: 'es',
    contexts: [system, thesauri],
  },
  {
    _id: db.id(),
    locale: 'fr',
    contexts: [system, thesauri],
  },
];

export { thesauri, translations, system };
