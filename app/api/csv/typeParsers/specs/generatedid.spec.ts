// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../csv/typeParsers.js' or its ... Remove this comment to see the full error message
import typeParsers from '../csv/typeParsers.js';

describe('generatedid parser', () => {
  const templateProp = { name: 'id', label: 'id', type: propertyTypes.generatedid };

  it('should return the value if the property has one', async () => {
    const rawEntity = { propertiesFromColumns: { id: 'XYZ123' }, language: 'en' };
    expect(await typeParsers.generatedid(rawEntity, templateProp)).toEqual({
      data: [{ value: 'XYZ123' }],
      warnings: [],
    });
  });

  it('should return a generated id if the property is empty', async () => {
    const rawEntity = { propertiesFromColumns: { id: '' }, language: 'en' };
    const {
      data: [propertyValue],
    } = await typeParsers.generatedid(rawEntity, templateProp);
    expect(propertyValue.value).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
  });
});
