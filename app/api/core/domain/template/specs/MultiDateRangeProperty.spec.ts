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

  describe('createPropertyAssignment()', () => {
    it('should create assignment with multiple date ranges', () => {
      const multiDateRange = new MultiDateRangeProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
      });

      const assignment = multiDateRange.createPropertyAssignment({
        value: [{ value: { from: 100, to: 200 } }, { value: { from: 300, to: 400 } }],
      });

      expect(assignment).toEqual({
        name: multiDateRange.name,
        type: multiDateRange.type,
        value: [{ value: { from: 100, to: 200 } }, { value: { from: 300, to: 400 } }],
      });
    });

    it('should allow empty value when not required', () => {
      const multiDateRange = new MultiDateRangeProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
      });

      const assignment = multiDateRange.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: multiDateRange.name,
        type: multiDateRange.type,
        value: [],
      });
    });

    it('should throw if required and no value is provided', () => {
      const multiDateRange = new MultiDateRangeProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => multiDateRange.createPropertyAssignment({ value: [] })).toThrow(
        'Multi Date Range Property is required'
      );
    });

    it('should throw if any value is not a number', () => {
      const multiDateRange = new MultiDateRangeProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
      });

      expect(() =>
        multiDateRange.createPropertyAssignment({
          value: [{ value: { from: 'a' as any, to: 2 } }],
        })
      ).toThrow();
    });
  });
});
