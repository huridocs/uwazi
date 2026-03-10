/** @format */
import { testingEnvironment } from 'api/utils/testingEnvironment';

import thesauri from 'api/thesauri';

import { fixtures, thesauri1Id } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

const rawEntityWithMultiselectValue = val => ({
  propertiesFromColumns: {
    multiselect_prop: val,
  },
});

describe('multiselect', () => {
  let thesauri1;

  const templateProp = { name: 'multiselect_prop', content: thesauri1Id };

  afterAll(async () => testingEnvironment.tearDown());
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);

    thesauri1 = await thesauri.getById(thesauri1Id);
  });

  it.each([
    {
      inputString: 'value4',
      expectationLabels: [' value4 '],
      expectationValueIds: [3],
      expectationWarnings: [],
    },
    {
      inputString: 'Value1|value3| value3',
      expectationLabels: ['value1', 'Value3'],
      expectationValueIds: [0, 2],
      expectationWarnings: [],
    },
    {
      inputString: 'value1| value2 | Value3',
      expectationLabels: ['value1', 'value2', 'Value3'],
      expectationValueIds: [0, 1, 2],
      expectationWarnings: [],
    },
    {
      inputString: 'value1|value2|VALUE4',
      expectationLabels: ['value1', 'value2', ' value4 '],
      expectationValueIds: [0, 1, 3],
      expectationWarnings: [],
    },
    {
      inputString: '',
      expectationLabels: [],
      expectationValueIds: [],
      expectationWarnings: [],
    },
    {
      inputString: '|',
      expectationLabels: [],
      expectationValueIds: [],
      expectationWarnings: [],
    },
  ])(
    'should find values in thesauri and return data with warnings',
    async ({ inputString, expectationLabels, expectationValueIds, expectationWarnings }) => {
      const result = await typeParsers.multiselect(
        rawEntityWithMultiselectValue(inputString),
        templateProp
      );

      const labels = result.data.map(v => v.label);
      expect(labels).toEqual(expectationLabels);

      const values = result.data.map(v => v.value);
      const expectedValues = expectationValueIds.map(id => thesauri1.values[id].id);
      expect(values).toEqual(expectedValues);

      expect(result.warnings).toEqual(expectationWarnings);
    }
  );

  it('should return warnings for non-existent values', async () => {
    const result = await typeParsers.multiselect(
      rawEntityWithMultiselectValue('non_existent_value'),
      templateProp
    );

    expect(result.data).toEqual([]);
    expect(result.warnings).toEqual([
      {
        property: 'multiselect_prop',
        value: 'non_existent_value',
        reason: '1 thesaurus value(s) not found',
      },
    ]);
  });

  it('should return warnings for mixed valid and invalid values', async () => {
    const result = await typeParsers.multiselect(
      rawEntityWithMultiselectValue('value1|non_existent_value|value2'),
      templateProp
    );

    const labels = result.data.map(v => v.label);
    expect(labels).toEqual(['value1', 'value2']);

    expect(result.warnings).toEqual([
      {
        property: 'multiselect_prop',
        value: 'value1|non_existent_value|value2',
        reason: '1 thesaurus value(s) not found',
      },
    ]);
  });

  it('should handle invalid parent-child format gracefully', async () => {
    const result = await typeParsers.multiselect(
      rawEntityWithMultiselectValue('a::b::c'),
      templateProp
    );

    expect(result.data).toEqual([]);
    expect(result.warnings).toEqual([
      {
        property: 'multiselect_prop',
        value: 'a::b::c',
        reason: '1 value(s) have invalid format',
      },
    ]);
  });
});
