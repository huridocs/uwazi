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
  translations_v2: [
    {
      language: 'es',
      key: 'B',
      value: 'Bes',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },
    {
      language: 'es',
      key: 'A',
      value: 'Aes',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },
    {
      language: 'es',
      key: 'multiselect_thesaurus',
      value: 'multiselect_thesaurus',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },

    {
      language: 'es',
      key: 'A',
      value: 'Aes',
      context: {
        id: fixtureFactory.id('Select Thesaurus').toString(),
        type: 'Dictionary',
        label: 'Select Thesaurus',
      },
    },
    // {
    //   language: 'es',
    //   key: 'B',
    //   value: 'Bes',
    //   context: {
    //     id: fixtureFactory.id('Select Thesaurus').toString(),
    //     type: 'Dictionary',
    //     label: 'Select Thesaurus',
    //   },
    // },
    {
      language: 'es',
      key: 'Select Thesaurus',
      value: 'Select Thesaurus',
      context: {
        id: fixtureFactory.id('Select Thesaurus').toString(),
        type: 'Dictionary',
        label: 'Select Thesaurus',
      },
    },

    {
      language: 'es',
      key: 'A',
      value: 'A',
      context: {
        id: fixtureFactory.id('nested_thesaurus').toString(),
        type: 'Dictionary',
        label: 'nested_thesaurus',
      },
    },
    {
      language: 'es',
      key: 'nested_thesaurus',
      value: 'nested_thesaurus',
      context: {
        id: fixtureFactory.id('nested_thesaurus').toString(),
        type: 'Dictionary',
        label: 'nested_thesaurus',
      },
    },
    {
      language: 'es',
      key: '1',
      value: '1',
      context: {
        id: fixtureFactory.id('no_new_value_thesaurus').toString(),
        type: 'Dictionary',
        label: 'no_new_value_thesaurus',
      },
    },
    {
      language: 'es',
      key: 'no_new_value_thesaurus',
      value: 'no_new_value_thesaurus',
      context: {
        id: fixtureFactory.id('no_new_value_thesaurus').toString(),
        type: 'Dictionary',
        label: 'no_new_value_thesaurus',
      },
    },
    {
      language: 'es',
      key: 'original 3',
      value: 'original 3',
      context: { id: 'System', type: 'System', label: 'System' },
    },
    {
      language: 'es',
      key: 'original 2',
      value: 'original 2',
      context: { id: 'System', type: 'System', label: 'System' },
    },
    {
      language: 'es',
      key: 'original 1',
      value: 'original 1',
      context: { id: 'System', type: 'System', label: 'System' },
    },

    {
      language: 'en',
      key: 'B',
      value: 'B',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },
    {
      language: 'en',
      key: 'A',
      value: 'A',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },
    {
      language: 'en',
      key: 'multiselect_thesaurus',
      value: 'multiselect_thesaurus',
      context: {
        id: fixtureFactory.id('multiselect_thesaurus').toString(),
        type: 'Dictionary',
        label: 'multiselect_thesaurus',
      },
    },

    {
      language: 'en',
      key: 'A',
      value: 'A',
      context: {
        id: fixtureFactory.id('Select Thesaurus').toString(),
        type: 'Dictionary',
        label: 'Select Thesaurus',
      },
    },
    // {
    //   language: 'en',
    //   key: 'B',
    //   value: 'Bes',
    //   context: {
    //     id: fixtureFactory.id('Select Thesaurus').toString(),
    //     type: 'Dictionary',
    //     label: 'Select Thesaurus',
    //   },
    // },
    {
      language: 'en',
      key: 'Select Thesaurus',
      value: 'Select Thesaurus',
      context: {
        id: fixtureFactory.id('Select Thesaurus').toString(),
        type: 'Dictionary',
        label: 'Select Thesaurus',
      },
    },

    {
      language: 'en',
      key: 'A',
      value: 'A',
      context: {
        id: fixtureFactory.id('nested_thesaurus').toString(),
        type: 'Dictionary',
        label: 'nested_thesaurus',
      },
    },
    {
      language: 'en',
      key: 'nested_thesaurus',
      value: 'nested_thesaurus',
      context: {
        id: fixtureFactory.id('nested_thesaurus').toString(),
        type: 'Dictionary',
        label: 'nested_thesaurus',
      },
    },
    {
      language: 'en',
      key: '1',
      value: '1',
      context: {
        id: fixtureFactory.id('no_new_value_thesaurus').toString(),
        type: 'Dictionary',
        label: 'no_new_value_thesaurus',
      },
    },
    {
      language: 'en',
      key: 'no_new_value_thesaurus',
      value: 'no_new_value_thesaurus',
      context: {
        id: fixtureFactory.id('no_new_value_thesaurus').toString(),
        type: 'Dictionary',
        label: 'no_new_value_thesaurus',
      },
    },
    {
      language: 'en',
      key: 'original 3',
      value: 'original 3',
      context: { id: 'System', type: 'System', label: 'System' },
    },
    {
      language: 'en',
      key: 'original 2',
      value: 'original 2',
      context: { id: 'System', type: 'System', label: 'System' },
    },
    {
      language: 'en',
      key: 'original 1',
      value: 'original 1',
      context: { id: 'System', type: 'System', label: 'System' },
    },
  ],
};

export { fixtures, fixtureFactory };
