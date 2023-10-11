import { propertyTypes } from 'shared/propertyTypes';
import typeParsers from 'api/csv/typeParsers';

describe('generatedid parser', () => {
  const templateProp = { name: 'id', label: 'id', type: propertyTypes.generatedid };

  it('should return the value if the property has one', async () => {
    const rawEntity = { propertiesFromColumns: { id: 'XYZ123' }, language: 'en' };
    expect(await typeParsers.generatedid(rawEntity, templateProp)).toEqual([{ value: 'XYZ123' }]);
  });

  it('should return a generated id if the property is empty', async () => {
    const rawEntity = { propertiesFromColumns: { id: '' }, language: 'en' };
    const [propertyValue] = await typeParsers.generatedid(rawEntity, templateProp);
    expect(propertyValue.value).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
  });
});
