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

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single date value', () => {
      const date = new DateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = date.createPropertyAssignment({ value: [{ value: 1761576489 }] });

      expect(assignment).toEqual({
        name: date.name,
        value: [{ value: 1761576489 }],
        type: date.type,
      });
    });

    it('should allow empty value when not required', () => {
      const date = new DateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = date.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: date.name,
        value: [],
        type: date.type,
      });
    });

    it('should throw if more than one value is provided', () => {
      const date = new DateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() => date.createPropertyAssignment({ value: [{ value: 1 }, { value: 2 }] })).toThrow(
        'Date Property only accepts a single value.'
      );
    });

    it('should throw if required and no value is provided', () => {
      const date = new DateProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => date.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Date Property is required'
      );
    });

    it('should throw if value is not a number', () => {
      const date = new DateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        date.createPropertyAssignment({ value: [{ value: 'not-a-number' } as any] })
      ).toThrow();
    });
  });
});
