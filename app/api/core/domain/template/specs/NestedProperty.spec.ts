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

      expect(assignment).toEqual({
        name: nested.name,
        type: nested.type,
        isTranslatable: false,
        value: [],
      });
    });

    it('should throw if required and no value is provided', () => {
      const nested = new NestedProperty({
        id: 'any_id',
        label: 'A label',
        template: 'any',
        required: true,
      });

      expect(() => nested.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Nested Property is required'
      );
    });

    it('should clean empty entries before validation', () => {
      const nested = new NestedProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = nested.createPropertyAssignment({ value: [{ value: null as any }] });

      expect(assignment).toEqual({
        name: nested.name,
        type: nested.type,
        isTranslatable: false,
        value: [{ value: null }],
      });
    });

    it('should allow empty nested objects by design', () => {
      const nested = new NestedProperty({ id: 'any_id', label: 'A label', template: 'any' });

      // Nested properties allow null values as they represent intentionally empty nested structures
      const assignment = nested.createPropertyAssignment({
        value: [
          { value: null as any },
          { value: {} },
          { value: { child_text: [{ value: 'some text' }] } },
        ],
      });

      expect(assignment.value).toEqual([
        { value: null },
        { value: {} },
        { value: { child_text: [{ value: 'some text' }] } },
      ]);
    });

    it('should create property assignment with nested children', () => {
      const nested = new NestedProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = nested.createPropertyAssignment({
        value: [
          {
            value: {
              child_text: [{ value: 'Some text' }],
              child_number: [{ value: 42 }],
            },
          },
          {
            value: {
              child_text: [{ value: 'More text' }],
              child_select: [{ value: 'select_id', label: 'Select Label' }],
            },
          },
        ],
      });

      expect(assignment).toEqual({
        name: nested.name,
        type: nested.type,
        isTranslatable: false,
        value: [
          {
            value: {
              child_text: [{ value: 'Some text' }],
              child_number: [{ value: 42 }],
            },
          },
          {
            value: {
              child_text: [{ value: 'More text' }],
              child_select: [{ value: 'select_id', label: 'Select Label' }],
            },
          },
        ],
      });
    });
  });
});
