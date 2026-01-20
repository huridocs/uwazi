import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { MarkdownProperty } from '#api/core/domain/template/MarkdownProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';

describe('MarkdownProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MarkdownProperty({
      id: 'any_id',
      template: 'any',
      label: 'A Title',
    });

    expect(property).toMatchObject({
      type: 'markdown',
    });
  });

  it('should throw if providing a type different from markdown', () => {
    expect(
      () =>
        new MarkdownProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MarkdownProperty'));
  });

  it('should ensure TextProperty is compatible to MarkdownProperty', () => {
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

    expect(() => markdown.ensurePropertyIsConsistent(text)).not.toThrow();
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single trimmed value', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = markdown.createPropertyAssignment({ value: [{ value: '  Hello  ' }] });

      expect(assignment).toEqual({
        name: markdown.name,
        type: markdown.type,
        isTranslatable: true,
        value: [{ value: 'Hello' }],
      });
    });

    it('should filter out empty and whitespace-only values', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = markdown.createPropertyAssignment({
        value: [{ value: '   Hello   ' }],
      });

      expect(assignment).toEqual({
        name: markdown.name,
        type: markdown.type,
        isTranslatable: true,
        value: [{ value: 'Hello' }],
      });
    });

    it('should handle null and undefined values', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment1 = markdown.createPropertyAssignment({
        value: [{ value: null as any }],
      });
      expect(assignment1.value).toEqual([]);

      const assignment2 = markdown.createPropertyAssignment({
        value: [{ value: undefined as any }],
      });
      expect(assignment2.value).toEqual([]);
    });

    it('should return empty array when all values are empty/whitespace', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = markdown.createPropertyAssignment({
        value: [{ value: '   ' }],
      });

      expect(assignment).toEqual({
        name: markdown.name,
        type: markdown.type,
        isTranslatable: true,
        value: [],
      });
    });

    it('should allow empty value when not required', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = markdown.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: markdown.name,
        type: markdown.type,
        isTranslatable: true,
        value: [],
      });
    });

    it('should throw if more than one value is provided', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        markdown.createPropertyAssignment({ value: [{ value: 'A' }, { value: 'B' }] })
      ).toThrow('Markdown Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const markdown = new MarkdownProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => markdown.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Markdown Property is required'
      );

      expect(() => markdown.createPropertyAssignment({ value: [{ value: '' }] }, true)).toThrow(
        'Markdown Property is required'
      );

      expect(() => markdown.createPropertyAssignment({ value: [{ value: '   ' }] }, true)).toThrow(
        'Markdown Property is required'
      );

      expect(() =>
        markdown.createPropertyAssignment({ value: [{ value: null as any }] }, true)
      ).toThrow('Markdown Property is required');
    });

    it('should throw if required and all provided values are empty/whitespace', () => {
      const markdown = new MarkdownProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() =>
        markdown.createPropertyAssignment(
          {
            value: [{ value: '   ' }],
          },
          true
        )
      ).toThrow('Markdown Property is required');
    });
  });
});
