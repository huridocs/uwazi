import { PropertyTypeInvalidTypeError } from '../errors';
import { GenerateIdProperty } from '../GenerateIdProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('GenerateIdProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new GenerateIdProperty({
      id: 'any_id',
      template: 'any',
      label: 'A Label',
    });

    expect(property).toMatchObject({
      type: 'generatedid',
    });
  });

  it('should throw if providing a type different from generatedid', () => {
    expect(
      () =>
        new GenerateIdProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'GenerateIdProperty'));
  });
});
