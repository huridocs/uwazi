/** @format */

import thesauri from 'api/thesauri';
import db from 'api/utils/testing_db';

import fixtures, { thesauri1Id } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

describe('select', () => {
  beforeEach(async () => db.clearAllAndLoad(fixtures));
  afterAll(async () => db.disconnect());

  it('should create thesauri value and return the id', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };

    const value1 = await typeParsers.select({ select_prop: 'value' }, templateProp);
    const value2 = await typeParsers.select({ select_prop: 'value2' }, templateProp);
    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(thesauri1.values[1].label).toBe('value');
    expect(thesauri1.values[2].label).toBe('value2');
    expect(value1).toEqual([{ value: thesauri1.values[1].id, label: 'value' }]);
    expect(value2).toEqual([{ value: thesauri1.values[2].id, label: 'value2' }]);
  });

  it('should not repeat case sensitive values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };

    await typeParsers.select({ select_prop: 'Value' }, templateProp);
    await typeParsers.select({ select_prop: 'value ' }, templateProp);

    await typeParsers.select({ select_prop: 'vAlue2' }, templateProp);
    await typeParsers.select({ select_prop: 'vAlue2' }, templateProp);

    await typeParsers.select({ select_prop: 'value4' }, templateProp);
    await typeParsers.select({ select_prop: 'ValUe4' }, templateProp);

    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(thesauri1.values.map(v => v.label)).toEqual([' value4 ', 'Value', 'vAlue2']);
  });

  it('should not create repeated values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };

    await typeParsers.select({ select_prop: 'value4' }, templateProp);
    await typeParsers.select({ select_prop: 'value ' }, templateProp);
    await typeParsers.select({ select_prop: 'value' }, templateProp);
    await typeParsers.select({ select_prop: ' value ' }, templateProp);
    await typeParsers.select({ select_prop: 'value4' }, templateProp);
    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(thesauri1.values.length).toBe(2);
  });

  it('should not create blank values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = { select_prop: ' ' };

    const value = await typeParsers.select(rawEntity, templateProp);
    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(thesauri1.values.length).toBe(1);
    expect(value).toBe(null);
  });
});
