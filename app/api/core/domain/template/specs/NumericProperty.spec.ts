import { PropertyTypeInvalidTypeError } from '../errors';
import { NumericProperty } from '../NumericProperty';
import { PropertyTypeEnum } from '../PropertyType';

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
      });
    });

    it('should coerce string to number', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [{ value: '42' } as any] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [{ value: 42 }],
        type: numeric.type,
      });
    });

    it('should allow empty value when not required', () => {
      const numeric = new NumericProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = numeric.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: numeric.name,
        value: [],
        type: numeric.type,
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

      expect(() => numeric.createPropertyAssignment({ value: [] })).toThrow(
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
      });
    });
  });
});
