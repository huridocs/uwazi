import db from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

const fixtureFactory = getFixturesFactory();

const commonTranslationContexts = () => [
  {
    id: 'System',
    label: 'System',
    values: [
      { key: 'original 1', value: 'original 1' },
      { key: 'original 2', value: 'original 2' },
      { key: 'original 3', value: 'original 3' },
    ],
  },
  {
    id: fixtureFactory.id('no_new_value_thesaurus').toString(),
    label: 'no_new_value_thesaurus',
    values: [
      { key: 'no_new_value_thesaurus', value: 'no_new_value_thesaurus' },
      { key: '1', value: '1' },
    ],
    type: 'Dictionary',
  },
  {
    id: fixtureFactory.id('nested_thesaurus').toString(),
    label: 'nested_thesaurus',
    values: [
      { key: 'nested_thesaurus', value: 'nested_thesaurus' },
      { key: 'A', value: 'A' },
    ],
    type: 'Dictionary',
  },
];

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
        content: fixtureFactory.id('no_new_value_thesaurus').toHexString(),
        label: 'no_new_value_select',
      }),
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('Select Thesaurus').toHexString(),
        label: 'Select Property',
      }),
      fixtureFactory.property('multiselect_property', 'multiselect', {
        content: fixtureFactory.id('multiselect_thesaurus').toHexString(),
        label: 'Multiselect Property',
      }),
      fixtureFactory.property('nested_select_property', 'select', {
        content: fixtureFactory.id('nested_thesaurus').toHexString(),
        label: 'Nested Select Property',
      }),
      fixtureFactory.property('nested_multiselect_property', 'multiselect', {
        content: fixtureFactory.id('nested_thesaurus').toHexString(),
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
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        ...commonTranslationContexts(),
        {
          id: fixtureFactory.id('Select Thesaurus').toString(),
          label: 'Select Thesaurus',
          values: [
            { key: 'Select Thesaurus', value: 'Select Thesaurus' },
            { key: 'A', value: 'A' },
          ],
          type: 'Dictionary',
        },
        {
          id: fixtureFactory.id('multiselect_thesaurus').toString(),
          label: 'multiselect_thesaurus',
          values: [
            { key: 'multiselect_thesaurus', value: 'multiselect_thesaurus' },
            { key: 'A', value: 'A' },
            { key: 'B', value: 'B' },
          ],
          type: 'Dictionary',
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        ...commonTranslationContexts(),
        {
          id: fixtureFactory.id('Select Thesaurus').toString(),
          label: 'Select Thesaurus',
          values: [
            { key: 'Select Thesaurus', value: 'Select Thesaurus' },
            { key: 'A', value: 'Aes' },
          ],
          type: 'Dictionary',
        },
        {
          id: fixtureFactory.id('multiselect_thesaurus').toString(),
          label: 'multiselect_thesaurus',
          values: [
            { key: 'multiselect_thesaurus', value: 'multiselect_thesaurus' },
            { key: 'A', value: 'Aes' },
            { key: 'B', value: 'Bes' },
          ],
          type: 'Dictionary',
        },
      ],
    },
  ],
};

export { fixtures, fixtureFactory };
