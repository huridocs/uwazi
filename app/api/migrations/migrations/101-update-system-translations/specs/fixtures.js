import db from 'api/utils/testing_db';

const spanishTranslations = [
  { key: 'Filters', value: 'Filtros' },
  { key: 'Library', value: 'Biblioteca' },
  {
    key: 'Create connections and references',
    value: 'Crear conecciones y referencias',
  },
  { key: 'connections', value: 'conexiones' },
];

const frenchTranslations = [
  { key: 'Filters', value: 'Filtres' },
  { key: 'Library', value: 'Bibliothèque' },
  {
    key: 'Create connections and references',
    value: 'Create connections and references',
  },
  { key: 'connections', value: 'connections' },
];

const system = {
  label: 'System',
  type: 'Uwazi UI',
  id: 'System',
  values: [
    { key: 'Filters', value: 'Filters' },
    { key: 'Library', value: 'Library' },
    {
      key: 'Create connections and references',
      value: 'Create connections and references',
    },
    { key: 'connections', value: 'connections' },
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

export const fixtures = {
  translations: [
    {
      locale: 'en',
      contexts: [system, thesauri],
    },
    {
      locale: 'es',
      contexts: [{ ...system, values: spanishTranslations }, thesauri],
    },
    {
      locale: 'fr',
      contexts: [{ ...system, values: frenchTranslations }, thesauri],
    },
  ],
};
