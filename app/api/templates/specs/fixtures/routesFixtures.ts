import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';

const templateCommonProperties = [
  {
    _id: '6193bf8c86a5e87060962287',
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
    prioritySorting: false,
    generatedId: false,
  },
  {
    _id: '6193bf8c86a5e87060962288',
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
  {
    _id: '6193bf8c86a5e87060962289',
    label: 'Date modified',
    name: 'editDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
];

const fixtureFactory = getFixturesFactory();
const fixtures: DBFixture = {
  settings: [
    {
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
  dictionaries: [
    fixtureFactory.thesauri('select_thesaurus', ['A']),
    fixtureFactory.thesauri('multiselect_thesaurus', ['A', 'B']),
    {
      name: 'select_thesaurus_2',
      _id: '123456789',
      values: [
        {
          _id: 'abc',
          id: 'A',
          label: 'A',
        },
      ],
    },
  ],
  templates: [
    {
      ...fixtureFactory.template('template1', []),
      commonProperties: templateCommonProperties,
      default: true,
    },
    fixtureFactory.template('template2', [
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('select_thesaurus'),
      }),
      fixtureFactory.property('multiselect_property', 'multiselect', {
        content: fixtureFactory.id('multiselect_thesaurus'),
      }),
    ]),
    fixtureFactory.template('template3', [
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('select_thesaurus'),
      }),
    ]),
    {
      _id: 'template_with_select_id',
      name: 'template_with_select',
      properties: [
        {
          _id: 'zxc',
          label: 'select_property',
          name: 'select_property',
          type: 'select',
          content: '123456789',
        },
      ],
    },
  ],
  translations_v2: [],
};

export { templateCommonProperties, fixtures, fixtureFactory };
