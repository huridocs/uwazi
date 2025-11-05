import { PropertyTypeInvalidTypeError } from '../errors';
import { MarkdownProperty } from '../MarkdownProperty';
import { PropertyTypeEnum } from '../PropertyType';
import { TextProperty } from '../TextProperty';

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
        value: [{ value: 'Hello' }],
      });
    });

    it('should allow empty value when not required', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = markdown.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: markdown.name, type: markdown.type, value: [] });
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

      expect(() => markdown.createPropertyAssignment({ value: [] })).toThrow(
        'Markdown Property is required'
      );
    });

    it('should throw when provided value is empty string or whitespace', () => {
      const markdown = new MarkdownProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() => markdown.createPropertyAssignment({ value: [{ value: '' }] })).toThrow(
        'Markdown Property must be a non-empty string.'
      );
      expect(() => markdown.createPropertyAssignment({ value: [{ value: '   ' }] })).toThrow(
        'Markdown Property must be a non-empty string.'
      );
    });
  });
});
