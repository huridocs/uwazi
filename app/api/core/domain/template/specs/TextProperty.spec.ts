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
        value: [{ value: 'Hello' }],
      });
    });

    it('should allow empty value when not required', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = text.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: text.name,
        type: text.type,
        value: [],
      });
    });

    it('should throw if more than one value is provided', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        text.createPropertyAssignment({ value: [{ value: 'A' }, { value: 'B' }] })
      ).toThrow('Text Property only accepts a single value.');
    });

    it('should throw when provided value is empty string even if not required', () => {
      const text = new TextProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() => text.createPropertyAssignment({ value: [{ value: '' }] })).toThrow(
        'Text Property must be a non-empty string.'
      );
      expect(() => text.createPropertyAssignment({ value: [{ value: '   ' }] })).toThrow(
        'Text Property must be a non-empty string.'
      );
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
    });
  });
});
