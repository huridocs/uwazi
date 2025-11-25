import { PropertyTypeInvalidTypeError } from '../errors';
import { MarkdownProperty } from '../MarkdownProperty';
import { PropertyTypeEnum } from '../PropertyType';
import { TextProperty } from '../TextProperty';

describe('TextProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new TextProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'text',
      generatedId: false,
    });
  });

  it('should throw if providing a type different from text', () => {
    expect(
      () =>
        new TextProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Date as any,
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('date', 'TextProperty'));
  });

  it('should ensure MarkdownProperty is compatible to TextProperty', () => {
    const text = new TextProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    const markdown = new MarkdownProperty({
      id: 'any_id_2',
      label: 'A Title',
      template: 'any',
    });

    expect(() => text.ensurePropertyIsConsistent(markdown)).not.toThrow();
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single trimmed value', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({ value: [{ value: '  Hello  ' }] });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        isTranslatable: true,
        value: [{ value: 'Hello' }],
      });
    });

    it('should filter out empty and whitespace-only values', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({
        value: [{ value: '' }, { value: '   ' }, { value: 'Hello' }],
      });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        isTranslatable: true,
        value: [{ value: 'Hello' }],
      });
    });

    it('should handle null and undefined values', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({
        value: [{ value: null as any }, { value: undefined as any }, { value: 'Valid' }],
      });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        isTranslatable: true,
        value: [{ value: 'Valid' }],
      });
    });

    it('should return empty array when all values are empty/whitespace', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({
        value: [{ value: '' }, { value: '   ' }, { value: '\t\n' }],
      });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        isTranslatable: true,
        value: [],
      });
    });

    it('should allow empty value when not required', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        isTranslatable: true,
        value: [],
      });
    });

    it('should throw if more than one value is provided', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        text.createPropertyAssignment({ value: [{ value: 'A' }, { value: 'B' }] })
      ).toThrow('Text Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const text = new TextProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => text.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Text Property is required'
      );

      expect(() => text.createPropertyAssignment({ value: [{ value: '' }] }, true)).toThrow(
        'Text Property is required'
      );

      expect(() => text.createPropertyAssignment({ value: [{ value: '   ' }] }, true)).toThrow(
        'Text Property is required'
      );

      expect(() =>
        text.createPropertyAssignment({ value: [{ value: null as any }] }, true)
      ).toThrow('Text Property is required');
    });

    it('should throw if required and all provided values are empty/whitespace', () => {
      const text = new TextProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() =>
        text.createPropertyAssignment(
          {
            value: [{ value: '' }, { value: '   ' }, { value: '\t\n' }],
          },
          true
        )
      ).toThrow('Text Property is required');
    });
  });
});
