import db from 'api/utils/testing_db';

const system = {
  label: 'System',
  type: 'Uwazi UI',
  id: 'System',
  values: [
    { key: 'Menu', value: 'Menu' },
    { key: 'Filters', value: 'Filters' },
    { key: 'Library', value: 'Library' },
    { key: 'Protect your account', value: 'Protect your account' },
    { key: 'Your account is protected by 2fa.', value: 'Your account is protected by 2fa.' },
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
