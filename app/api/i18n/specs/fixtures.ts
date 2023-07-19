import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture } from 'api/utils/testing_db';
import { fixturesTranslationsV2ToTranslationsLegacy } from './fixturesTranslationsV2ToTranslationsLegacy';

const entityTemplateId = db.id();
const documentTemplateId = db.id();
const englishTranslation = db.id();
const dictionaryId = db.id();

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;
// eslint-disable-next-line camelcase
const translationsV2: DBFixture['translationsV2'] = [
  createTranslationDBO('Age', 'Age', 'zh', { id: 'System', label: 'System', type: 'Uwazi UI' }),
  createTranslationDBO('Library', 'Library', 'zh', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Email', 'Email', 'zh', { id: 'System', label: 'System', type: 'Uwazi UI' }),
  createTranslationDBO('Account', 'Account', 'zh', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Password', 'Password', 'zh', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Age', 'Edad', 'zh', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Email', 'E-Mail', 'zh', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Account', 'Cuenta', 'zh', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Password', 'Contraseña', 'zh', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('dictionary 2', 'dictionary 2', 'zh', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Age', 'Edad', 'es', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Email', 'E-Mail', 'es', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Account', 'Cuenta', 'es', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Password', 'Contraseña', 'es', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('dictionary 2', 'dictionary 2', 'es', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Age', 'Edad', 'es', { id: 'System', label: 'System', type: 'Uwazi UI' }),
  createTranslationDBO('Email', 'Correo electronico', 'es', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Account', 'Cuenta', 'es', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Password', 'Contraseña', 'es', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Library', 'Library', 'es', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Age', 'Age', 'en', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Email', 'E-Mail', 'en', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Account', 'Account', 'en', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Password', 'Password', 'en', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('dictionary 2', 'dictionary 2', 'en', {
    id: dictionaryId.toString(),
    label: 'Dictionary',
    type: 'Thesaurus',
  }),
  createTranslationDBO('Library', 'Library', 'en', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Age', 'Age', 'en', { id: 'System', label: 'System', type: 'Uwazi UI' }),
  createTranslationDBO('Email', 'E-Mail', 'en', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Account', 'Account', 'en', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
  createTranslationDBO('Password', 'Password', 'en', {
    id: 'System',
    label: 'System',
    type: 'Uwazi UI',
  }),
];

const fixtures: DBFixture = {
  // eslint-disable-next-line camelcase
  translationsV2,
  translations: fixturesTranslationsV2ToTranslationsLegacy(translationsV2),
  settings: [
    {
      _id: db.id(),
      languages: [
        {
          key: 'es',
          label: 'Español',
        },
        {
          key: 'en',
          label: 'English',
          default: true,
        },
        {
          key: 'zh',
          label: 'Chinese',
        },
      ],
    },
  ],
  dictionaries: [
    {
      _id: dictionaryId,
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'Password' },
        { id: '2', label: 'Account' },
        { id: '3', label: 'Email' },
        { id: 'age id', label: 'Age' },
      ],
    },
  ],
  templates: [
    {
      _id: entityTemplateId,
      type: 'template',
    },
    {
      _id: documentTemplateId,
      type: 'template',
    },
  ],
};

export default fixtures;
export { entityTemplateId, englishTranslation, documentTemplateId, dictionaryId };
