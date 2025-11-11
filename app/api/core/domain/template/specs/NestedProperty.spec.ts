import { NestedProperty } from '../NestedProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('NestedProperty', () => {
  it('should include nested type at the end of the PropertyName', () => {
    const nestedProperty = new NestedProperty({
      id: 'any_id',
      label: 'A label',
      type: PropertyTypeEnum.Nested,
      template: 'any',
    });

    expect(nestedProperty.name).toBe('a_label_nested');
  });

  it('should not generate a PropertyName if one is provided', () => {
    const nestedProperty = new NestedProperty({
      id: 'any_id',
      label: 'A label',
      type: PropertyTypeEnum.Nested,
      name: 'a_label_2_nested',
      template: 'any',
    });

    expect(nestedProperty.name).toBe('a_label_2_nested');
  });

  describe('createPropertyAssignment()', () => {
    it('should allow empty value when not required', () => {
      const nested = new NestedProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = nested.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: nested.name, type: nested.type, value: [] });
    });

    it('should throw if required and no value is provided', () => {
      const nested = new NestedProperty({
        id: 'any_id',
        label: 'A label',
        template: 'any',
        required: true,
      });

      expect(() => nested.createPropertyAssignment({ value: [] })).toThrow(
        'Nested Property is required'
      );
    });

    it('should clean empty entries before validation', () => {
      const nested = new NestedProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = nested.createPropertyAssignment({ value: [{ value: null as any }] });

      expect(assignment).toEqual({
        name: nested.name,
        type: nested.type,
        value: [{ value: null }],
      });
    });
  });
});
