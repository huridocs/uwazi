import { PropertyTypeInvalidTypeError } from '../errors';
import { MarkdownProperty } from '../MarkdownProperty';
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
      () => new MarkdownProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
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
});
