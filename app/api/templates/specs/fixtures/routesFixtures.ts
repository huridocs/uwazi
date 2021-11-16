import { getFixturesFactory } from 'api/utils/fixturesFactory';

const templateCommonProperties = [
  {
    _id: '6193bf8c86a5e87060962287',
    localID: 'commonTitle',
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
    prioritySorting: false,
    generatedId: false,
  },
  {
    _id: '6193bf8c86a5e87060962288',
    localID: 'commonCreationDate',
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
  {
    _id: '6193bf8c86a5e87060962289',
    localID: 'commonEditDate',
    label: 'Date modified',
    name: 'editDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
];

const fixtureFactory = getFixturesFactory();
const fixtures = {
  templates: [
    {
      ...fixtureFactory.template('template1', []),
      commonProperties: templateCommonProperties,
    },
    fixtureFactory.template('template2', []),
    fixtureFactory.template('template3', []),
  ],
};

export { templateCommonProperties, fixtures, fixtureFactory };
