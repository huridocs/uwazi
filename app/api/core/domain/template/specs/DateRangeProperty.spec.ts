import { PropertyTypeInvalidTypeError } from '../errors';
import { DateRangeProperty } from '../DateRangeProperty';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty';
import { PropertyTypeEnum } from '../PropertyType';

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
      () =>
        new DateRangeProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
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

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single date range', () => {
      const dateRange = new DateRangeProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = dateRange.createPropertyAssignment({
        value: [{ value: { from: 1761576489, to: 1761576490 } }],
      });

      expect(assignment).toEqual({
        name: dateRange.name,
        value: [{ value: { from: 1761576489, to: 1761576490 } }],
        type: dateRange.type,
      });
    });

    it('should allow equal from and to', () => {
      const dateRange = new DateRangeProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = dateRange.createPropertyAssignment({
        value: [{ value: { from: 1761576489, to: 1761576489 } }],
      });

      expect(assignment).toEqual({
        name: dateRange.name,
        value: [{ value: { from: 1761576489, to: 1761576489 } }],
        type: dateRange.type,
      });
    });

    it('should allow empty value when not required', () => {
      const dateRange = new DateRangeProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = dateRange.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: dateRange.name,
        value: [],
        type: dateRange.type,
      });
    });

    it('should throw if more than one value is provided', () => {
      const dateRange = new DateRangeProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        dateRange.createPropertyAssignment({
          value: [{ value: { from: 1, to: 2 } }, { value: { from: 3, to: 4 } }],
        })
      ).toThrow('Date Range Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const dateRange = new DateRangeProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => dateRange.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Date Range Property is required'
      );
    });

    it('should throw if "to" is before "from"', () => {
      const dateRange = new DateRangeProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        dateRange.createPropertyAssignment({ value: [{ value: { from: 20, to: 10 } }] })
      ).toThrow();
    });
  });
});
