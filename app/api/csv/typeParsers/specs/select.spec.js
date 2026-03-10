/** @format */
import { testingEnvironment } from 'api/utils/testingEnvironment';

import thesauri from 'api/thesauri';

import { fixtures, thesauri1Id } from '../../specs/fixtures';
import typeParsers from '../../typeParsers';

const rawEntityWithSelectValue = val => ({
  propertiesFromColumns: {
    select_prop: val,
  },
});

describe('select', () => {
  beforeEach(async () => testingEnvironment.setUp(fixtures));
  afterAll(async () => testingEnvironment.tearDown());

  it('should find thesauri value and return the id and value', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };

    const value1 = await typeParsers.select(rawEntityWithSelectValue('value1'), templateProp);
    const value2 = await typeParsers.select(rawEntityWithSelectValue('vAlUe2'), templateProp);
    const thesauri1 = await thesauri.getById(thesauri1Id);

    expect(value1).toEqual({
      data: [{ value: thesauri1.values[0].id, label: 'value1' }],
      warnings: [],
    });
    expect(value2).toEqual({
      data: [{ value: thesauri1.values[1].id, label: 'value2' }],
      warnings: [],
    });
  });

  it('should return empty data and warnings for non-existent values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = rawEntityWithSelectValue('non_existent_value');

    const value = await typeParsers.select(rawEntity, templateProp);

    expect(value).toEqual({
      data: [],
      warnings: [
        {
          property: 'select_prop',
          value: 'non_existent_value',
          reason: 'Thesaurus value not found',
        },
      ],
    });
  });

  it('should return empty data and warnings for invalid format', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = rawEntityWithSelectValue('invalid::format::with::too::many::separators');

    const value = await typeParsers.select(rawEntity, templateProp);

    expect(value).toEqual({
      data: [],
      warnings: [
        {
          property: 'select_prop',
          value: 'invalid::format::with::too::many::separators',
          reason: 'Invalid thesaurus value format',
        },
      ],
    });
  });

  it('should sanitize values with extra spaces around separators', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = rawEntityWithSelectValue('  value1  ::  value2  ');

    const value = await typeParsers.select(rawEntity, templateProp);

    expect(value).toEqual({
      data: [],
      warnings: [
        {
          property: 'select_prop',
          value: '  value1  ::  value2  ',
          reason: 'Thesaurus value not found',
        },
      ],
    });
  });

  it('should return empty data and warnings on blank values', async () => {
    const templateProp = { name: 'select_prop', content: thesauri1Id };
    const rawEntity = rawEntityWithSelectValue('');

    const value = await typeParsers.select(rawEntity, templateProp);

    expect(value).toEqual({ data: [], warnings: [] });
  });
});
