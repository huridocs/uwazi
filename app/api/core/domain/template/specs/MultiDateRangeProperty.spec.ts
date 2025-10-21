import { DateRangeProperty } from '../DateRangeProperty';
import { PropertyTypeInvalidTypeError } from '../errors';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('MultiDateRangeProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MultiDateRangeProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'multidaterange',
    });
  });

  it('should throw if providing a type different from multidaterange', () => {
    expect(
      () =>
        new MultiDateRangeProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MultiDateRangeProperty'));
  });

  it('should ensure DateRangeProperty is compatible to MultiDateRangeProperty', () => {
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

    expect(() => multiDateRange.ensurePropertyIsConsistent(dateRange)).not.toThrow();
  });
});
