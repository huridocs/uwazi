import { PropertyTypeInvalidTypeError } from '../errors';
import { DateRangeProperty } from '../DateRangeProperty';

describe('DateRangeProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new DateRangeProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'daterange',
    });
  });

  it('should throw if providing a type different from daterange', () => {
    expect(
      () => new DateRangeProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'DateRangeProperty'));
  });
});
