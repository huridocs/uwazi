import { PropertyTypeInvalidTypeError } from '../errors';
import { DateProperty } from '../DateProperty';
import { MultiDateProperty } from '../MultiDateProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('DateProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new DateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'date',
    });
  });

  it('should throw if providing a type different from date', () => {
    expect(
      () =>
        new DateProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'DateProperty'));
  });

  it('should ensure MultiDateProperty is compatible to DateProperty', () => {
    const date = new DateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    const multiDate = new MultiDateProperty({
      id: 'any_id_2',
      label: 'A Title',
      template: 'any',
    });

    expect(() => date.ensurePropertyIsConsistent(multiDate)).not.toThrow();
  });
});
