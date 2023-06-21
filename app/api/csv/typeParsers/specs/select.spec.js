/** @format */

import thesauri from 'api/thesauri';
import db from 'api/utils/testing_db';

import { fixtures, thesauri1Id } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

describe('select', () => {
  beforeEach(async () => db.clearAllAndLoad(fixtures));
  afterAll(async () => db.disconnect());

  it('should find thesauri value and return the id and value', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };

    const value1 = await typeParsers.select({ select_prop: 'value1' }, templateProp);
    const value2 = await typeParsers.select({ select_prop: 'vAlUe2' }, templateProp);
    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(value1).toEqual([{ value: thesauri1.values[0].id, label: 'value1' }]);
    expect(value2).toEqual([{ value: thesauri1.values[1].id, label: 'value2' }]);
  });

  it('should return null on blank values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = { select_prop: ' ' };

    const value = await typeParsers.select(rawEntity, templateProp);

    expect(value).toBe(null);
  });
});
