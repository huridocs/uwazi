import db from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const fixtureFactory = getFixturesFactory();
const createContext = fixtureFactory.v2.database.nestedTranslationContextDBO;
const createTranslationDBO = fixtureFactory.v2.database.translationDBO;

const multiselectContext = createContext('multiselect_thesaurus');

const selectContext = createContext('Select Thesaurus');

const noNewValueContext = createContext('no_new_value_thesaurus');

const fixtures = {
  dictionaries: [
    fixtureFactory.thesauri('no_new_value_thesaurus', ['1', '2', '3']),
    fixtureFactory.nestedThesauri('Select Thesaurus', ['A', { 1: ['1A', '1B', 'A'] }]),
    fixtureFactory.nestedThesauri('multiselect_thesaurus', [
      'A',
      'B',
      { 1: ['1A'], 2: ['2A', '2B'] },
    ]),
  ],
  templates: [
    fixtureFactory.template('template', [
      fixtureFactory.property('unrelated_property', 'text'),
      fixtureFactory.property('no_new_value_select', 'select', {
        content: fixtureFactory.id('no_new_value_thesaurus'),
        label: 'no_new_value_select',
      }),
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('Select Thesaurus'),
        label: 'Select Property',
      }),
      fixtureFactory.property('multiselect_property', 'multiselect', {
        content: fixtureFactory.id('multiselect_thesaurus'),
        label: 'Multiselect Property',
      }),
    ]),
    fixtureFactory.template('no_selects_template', [
      fixtureFactory.property('unrelated_property', 'text'),
    ]),
  ],
  entities: [
    fixtureFactory.entity('existing_entity', 'template', {
      unrelated_property: [fixtureFactory.metadataValue('unrelated_value')],
      no_new_value_select: [fixtureFactory.metadataValue('1')],
      select_property: [fixtureFactory.metadataValue('A', 'A')],
      multiselect_property: [
        fixtureFactory.metadataValue('A', 'A'),
        fixtureFactory.metadataValue('B', 'B'),
      ],
    }),
    fixtureFactory.entity(
      'existing_entity',
      'template',
      {
        unrelated_property: [fixtureFactory.metadataValue('unrelated_value')],
        no_new_value_select: [fixtureFactory.metadataValue('1')],
        select_property: [fixtureFactory.metadataValue('A', 'Aes')],
        multiselect_property: [
          fixtureFactory.metadataValue('A', 'Aes'),
          fixtureFactory.metadataValue('B', 'Bes'),
        ],
      },
      { language: 'es' }
    ),
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translationsV2: [
    createTranslationDBO('B', 'Bes', 'es', multiselectContext),
    createTranslationDBO('A', 'Aes', 'es', multiselectContext),
    createTranslationDBO('1', '1es', 'es', multiselectContext),
    createTranslationDBO('1A', '1Aes', 'es', multiselectContext),
    createTranslationDBO('2', '2es', 'es', multiselectContext),
    createTranslationDBO('2A', '2Aes', 'es', multiselectContext),
    createTranslationDBO('2B', '2Bes', 'es', multiselectContext),
    createTranslationDBO(
      'multiselect_thesaurus',
      'multiselect_thesaurus',
      'es',
      multiselectContext
    ),
    createTranslationDBO('A', 'Aes', 'es', selectContext),
    createTranslationDBO('1', '1es', 'es', selectContext),
    createTranslationDBO('1A', '1Aes', 'es', selectContext),
    createTranslationDBO('1B', '1Bes', 'es', selectContext),
    createTranslationDBO('Select Thesaurus', 'Select Thesaurus', 'es', selectContext),
    createTranslationDBO('1', '1', 'es', noNewValueContext),
    createTranslationDBO(
      'no_new_value_thesaurus',
      'no_new_value_thesaurus',
      'es',
      noNewValueContext
    ),
    createTranslationDBO('original 3', 'original 3', 'es'),
    createTranslationDBO('original 2', 'original 2', 'es'),
    createTranslationDBO('original 1', 'original 1', 'es'),
    createTranslationDBO('B', 'B', 'en', multiselectContext),
    createTranslationDBO('A', 'A', 'en', multiselectContext),
    createTranslationDBO('1', '1', 'en', multiselectContext),
    createTranslationDBO('1A', '1A', 'en', multiselectContext),
    createTranslationDBO('2', '2', 'en', multiselectContext),
    createTranslationDBO('2A', '2A', 'en', multiselectContext),
    createTranslationDBO('2B', '2B', 'en', multiselectContext),
    createTranslationDBO(
      'multiselect_thesaurus',
      'multiselect_thesaurus',
      'en',
      multiselectContext
    ),
    createTranslationDBO('A', 'A', 'en', selectContext),
    createTranslationDBO('1', '1', 'en', selectContext),
    createTranslationDBO('1A', '1A', 'en', selectContext),
    createTranslationDBO('1B', '1B', 'en', selectContext),
    createTranslationDBO('Select Thesaurus', 'Select Thesaurus', 'en', selectContext),
    createTranslationDBO('1', '1', 'en', noNewValueContext),
    createTranslationDBO(
      'no_new_value_thesaurus',
      'no_new_value_thesaurus',
      'en',
      noNewValueContext
    ),
    createTranslationDBO('original 3', 'original 3', 'en'),
    createTranslationDBO('original 2', 'original 2', 'en'),
    createTranslationDBO('original 1', 'original 1', 'en'),
  ],
};

export { fixtures, fixtureFactory };
