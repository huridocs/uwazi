import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';

describe('NumericProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new NumericProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'numeric',
    });
  });

  it('should throw if providing a type different from numeric', () => {
    expect(
      () =>
        new NumericProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'NumericProperty'));
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single numeric value', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [{ value: 42 }] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [{ value: 42 }],
        type: numeric.type,
        isTranslatable: false,
      });
    });

    it('should coerce string to number', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [{ value: '42' } as any] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [{ value: 42 }],
        type: numeric.type,
        isTranslatable: false,
      });
    });

    it('should allow empty value when not required', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [],
        type: numeric.type,
        isTranslatable: false,
      });
    });

    it('should throw if more than one value is provided', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        numeric.createPropertyAssignment({ value: [{ value: 1 }, { value: 2 }] })
      ).toThrow('Numeric Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const numeric = new NumericProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => numeric.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Numeric Property is required'
      );
    });

    it('should delete the value when proving empty string', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [{ value: '' } as any] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [],
        type: numeric.type,
        isTranslatable: false,
      });
    });

    it('should handle whitespace-only strings by coercing to 0', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [{ value: '   ' } as any] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [{ value: 0 }], // Whitespace coerced to 0
        type: numeric.type,
        isTranslatable: false,
      });
    });

    it('should handle null and undefined values', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment1 = numeric.createPropertyAssignment({ value: [{ value: null } as any] });
      expect(assignment1.value).toEqual([]);

      const assignment2 = numeric.createPropertyAssignment({
        value: [{ value: undefined } as any],
      });
      expect(assignment2.value).toEqual([]);
    });

    it('should throw if required and empty string provided', () => {
      const numeric = new NumericProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() =>
        numeric.createPropertyAssignment({ value: [{ value: '' } as any] }, true)
      ).toThrow('Numeric Property is required');

      // Note: Whitespace strings are coerced to 0, so they don't get filtered out
    });
  });
});
