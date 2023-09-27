import db from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { fixturesTranslationsV2ToTranslationsLegacy } from 'api/i18n/specs/fixturesTranslationsV2ToTranslationsLegacy';

const fixtureFactory = getFixturesFactory();
const createTranslationDBO = fixtureFactory.v2.database.translationDBO;

const fixtures = {
  dictionaries: [
    fixtureFactory.thesauri('no_new_value_thesaurus', ['1', '2', '3']),
    fixtureFactory.thesauri('Select Thesaurus', ['A']),
    fixtureFactory.thesauri('multiselect_thesaurus', ['A', 'B']),
    fixtureFactory.nestedThesauri('nested_thesaurus', [
      { A: ['1', '2', '3'], C: ['X', 'Y', 'Z'] },
      'B',
      { P: ['|', '2', '|||'] },
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
      fixtureFactory.property('nested_select_property', 'select', {
        content: fixtureFactory.id('nested_thesaurus'),
        label: 'Nested Select Property',
      }),
      fixtureFactory.property('nested_multiselect_property', 'multiselect', {
        content: fixtureFactory.id('nested_thesaurus'),
        label: 'Nested MultiSelect Property',
      }),
    ]),
    fixtureFactory.template('no_selects_template', [
      fixtureFactory.property('unrelated_property', 'text'),
    ]),
  ],
  entities: [
    fixtureFactory.entity('existing_entity_id', 'template', {
      unrelated_property: [fixtureFactory.metadataValue('unrelated_value')],
      no_new_value_select: [fixtureFactory.metadataValue('1')],
      select_property: [fixtureFactory.metadataValue('A')],
      multiselect_property: [fixtureFactory.metadataValue('A'), fixtureFactory.metadataValue('B')],
    }),
    fixtureFactory.entity(
      'existing_entity_id',
      'template',
      {
        unrelated_property: [fixtureFactory.metadataValue('unrelated_value')],
        no_new_value_select: [fixtureFactory.metadataValue('1')],
        select_property: [{ label: 'Aes', value: 'A' }],
        multiselect_property: [
          { label: 'Aes', value: 'A' },
          { label: 'Bes', value: 'B' },
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
    createTranslationDBO('B', 'Bes', 'es', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('A', 'Aes', 'es', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('multiselect_thesaurus', 'multiselect_thesaurus', 'es', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('A', 'Aes', 'es', {
      id: fixtureFactory.id('Select Thesaurus').toString(),
      type: 'Thesaurus',
      label: 'Select Thesaurus',
    }),
    createTranslationDBO('Select Thesaurus', 'Select Thesaurus', 'es', {
      id: fixtureFactory.id('Select Thesaurus').toString(),
      type: 'Thesaurus',
      label: 'Select Thesaurus',
    }),
    createTranslationDBO('A', 'A', 'es', {
      id: fixtureFactory.id('nested_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'nested_thesaurus',
    }),
    createTranslationDBO('nested_thesaurus', 'nested_thesaurus', 'es', {
      id: fixtureFactory.id('nested_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'nested_thesaurus',
    }),
    createTranslationDBO('1', '1', 'es', {
      id: fixtureFactory.id('no_new_value_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'no_new_value_thesaurus',
    }),
    createTranslationDBO('no_new_value_thesaurus', 'no_new_value_thesaurus', 'es', {
      id: fixtureFactory.id('no_new_value_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'no_new_value_thesaurus',
    }),
    createTranslationDBO('original 3', 'original 3', 'es', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('original 2', 'original 2', 'es', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('original 1', 'original 1', 'es', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('B', 'B', 'en', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('A', 'A', 'en', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('multiselect_thesaurus', 'multiselect_thesaurus', 'en', {
      id: fixtureFactory.id('multiselect_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'multiselect_thesaurus',
    }),
    createTranslationDBO('A', 'A', 'en', {
      id: fixtureFactory.id('Select Thesaurus').toString(),
      type: 'Thesaurus',
      label: 'Select Thesaurus',
    }),
    createTranslationDBO('Select Thesaurus', 'Select Thesaurus', 'en', {
      id: fixtureFactory.id('Select Thesaurus').toString(),
      type: 'Thesaurus',
      label: 'Select Thesaurus',
    }),
    createTranslationDBO('A', 'A', 'en', {
      id: fixtureFactory.id('nested_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'nested_thesaurus',
    }),
    createTranslationDBO('nested_thesaurus', 'nested_thesaurus', 'en', {
      id: fixtureFactory.id('nested_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'nested_thesaurus',
    }),
    createTranslationDBO('1', '1', 'en', {
      id: fixtureFactory.id('no_new_value_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'no_new_value_thesaurus',
    }),
    createTranslationDBO('no_new_value_thesaurus', 'no_new_value_thesaurus', 'en', {
      id: fixtureFactory.id('no_new_value_thesaurus').toString(),
      type: 'Thesaurus',
      label: 'no_new_value_thesaurus',
    }),
    createTranslationDBO('original 3', 'original 3', 'en', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('original 2', 'original 2', 'en', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
    createTranslationDBO('original 1', 'original 1', 'en', {
      id: 'System',
      type: 'Uwazi UI',
      label: 'System',
    }),
  ],
};

export { fixtures, fixtureFactory };
