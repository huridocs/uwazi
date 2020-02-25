/** @format */

import thesauri from 'api/thesauri';
import db from 'api/utils/testing_db';

import fixtures, { thesauri1Id } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

describe('multiselect', () => {
  let value1;
  let value2;
  let value3;
  let value4;
  let thesauri1;

  const templateProp = { name: 'multiselect_prop', content: thesauri1Id };

  afterAll(async () => db.disconnect());
  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);
    value1 = await typeParsers.multiselect({ multiselect_prop: 'value4' }, templateProp);

    value2 = await typeParsers.multiselect(
      { multiselect_prop: 'Value1|value3| value3' },
      templateProp
    );

    value3 = await typeParsers.multiselect(
      { multiselect_prop: 'value1| value2 | Value3' },
      templateProp
    );

    value4 = await typeParsers.multiselect(
      { multiselect_prop: 'value1|value2|VALUE4' },
      templateProp
    );

    await typeParsers.multiselect({ multiselect_prop: '' }, templateProp);

    await typeParsers.multiselect({ multiselect_prop: '|' }, templateProp);

    thesauri1 = await thesauri.getById(thesauri1Id);
  });

  it('should create thesauri values and return an array of ids', async () => {
    expect(thesauri1.values[0].label).toBe(' value4 ');
    expect(thesauri1.values[1].label).toBe('Value1');
    expect(thesauri1.values[2].label).toBe('value3');
    expect(thesauri1.values[3].label).toBe('value2');

    expect(value1).toEqual([{ value: thesauri1.values[0].id, label: ' value4 ' }]);
    expect(value2).toEqual([
      { value: thesauri1.values[1].id, label: 'Value1' },
      { value: thesauri1.values[2].id, label: 'value3' },
    ]);
    expect(value3).toEqual([
      { value: thesauri1.values[1].id, label: 'Value1' },
      { value: thesauri1.values[2].id, label: 'value3' },
      { value: thesauri1.values[3].id, label: 'value2' },
    ]);
    expect(value4).toEqual([
      { value: thesauri1.values[0].id, label: ' value4 ' },
      { value: thesauri1.values[1].id, label: 'Value1' },
      { value: thesauri1.values[3].id, label: 'value2' },
    ]);
  });

  it('should not create blank values, or repeat values', async () => {
    expect(thesauri1.values.length).toBe(4);
  });
});
