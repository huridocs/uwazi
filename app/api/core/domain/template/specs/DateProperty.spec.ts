import { PropertyTypeInvalidTypeError } from '../errors';
import { DateProperty } from '../DateProperty';

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
      () => new DateProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'DateProperty'));
  });
});
