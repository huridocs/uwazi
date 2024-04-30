/** @format */

import thesauri from 'api/thesauri';
import db from 'api/utils/testing_db';

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

  afterAll(async () => db.disconnect());
  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);

    thesauri1 = await thesauri.getById(thesauri1Id);
  });

  it.each([
    {
      inputString: 'value4',
      expectationLabels: [' value4 '],
      expectationValueIds: [3],
    },
    {
      inputString: 'Value1|value3| value3',
      expectationLabels: ['value1', 'Value3'],
      expectationValueIds: [0, 2],
    },
    {
      inputString: 'value1| value2 | Value3',
      expectationLabels: ['value1', 'value2', 'Value3'],
      expectationValueIds: [0, 1, 2],
    },
    {
      inputString: 'value1|value2|VALUE4',
      expectationLabels: ['value1', 'value2', ' value4 '],
      expectationValueIds: [0, 1, 3],
    },
    {
      inputString: '',
      expectationLabels: [],
      expectationValueIds: [],
    },
    {
      inputString: '|',
      expectationLabels: [],
      expectationValueIds: [],
    },
  ])(
    'should find values in thesauri and return an array of ids and labels',
    async ({ inputString, expectationLabels, expectationValueIds }) => {
      const value = await typeParsers.multiselect(
        rawEntityWithMultiselectValue(inputString),
        templateProp
      );

      const labels = value.map(v => v.label);
      expect(labels).toEqual(expectationLabels);

      const values = value.map(v => v.value);
      const expectedValues = expectationValueIds.map(id => thesauri1.values[id].id);
      expect(values).toEqual(expectedValues);
    }
  );

  it.each([
    { inputString: 'a::b::c', message: 'Label "a::b::c" has too many parent-child separators.' },
    {
      inputString: '1|2::3::4|a::b',
      message: 'Label "2::3::4" has too many parent-child separators.',
    },
  ])('should throw an error on malformed parent-child inputs', async ({ inputString, message }) => {
    const promise = typeParsers.multiselect(
      rawEntityWithMultiselectValue(inputString),
      templateProp
    );
    await expect(promise).rejects.toThrow(message);
  });
});
