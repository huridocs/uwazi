import { PropertyTypeInvalidTypeError } from '../errors';
import { DateRangeProperty } from '../DateRangeProperty';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty';

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

  it('should ensure MultiDateRangeProperty is compatible to DateRangeProperty', () => {
    const dateRange = new DateRangeProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    const multiDateRange = new MultiDateRangeProperty({
      id: 'any_id_2',
      label: 'A Title',
      template: 'any',
    });

    expect(() => dateRange.ensurePropertyIsConsistent(multiDateRange)).not.toThrow();
  });
});
