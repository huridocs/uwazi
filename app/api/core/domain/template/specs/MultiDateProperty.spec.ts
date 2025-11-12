import { DateProperty } from '../DateProperty';
import { PropertyTypeInvalidTypeError } from '../errors';
import { MultiDateProperty } from '../MultiDateProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('MultiDateProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MultiDateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'multidate',
    });
  });

  it('should throw if providing a type different from multidate', () => {
    expect(
      () =>
        new MultiDateProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MultiDateProperty'));
  });

  it('should ensure DateProperty is compatible to MultiDateProperty', () => {
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

    expect(() => multiDate.ensurePropertyIsConsistent(date)).not.toThrow();
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with multiple date values', () => {
      const multiDate = new MultiDateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = multiDate.createPropertyAssignment({
        value: [{ value: 1700000000 }, { value: 1800000000 }],
      });

      expect(assignment).toEqual({
        name: multiDate.name,
        type: multiDate.type,
        value: [{ value: 1700000000 }, { value: 1800000000 }],
      });
    });

    it('should allow empty value when not required', () => {
      const multiDate = new MultiDateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = multiDate.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: multiDate.name, type: multiDate.type, value: [] });
    });

    it('should throw if required and no value is provided', () => {
      const multiDate = new MultiDateProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => multiDate.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Multi Date Property is required'
      );
    });

    it('should throw if any value is not a number', () => {
      const multiDate = new MultiDateProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        multiDate.createPropertyAssignment({ value: [{ value: 'oops' } as any] })
      ).toThrow();
    });
  });
});
