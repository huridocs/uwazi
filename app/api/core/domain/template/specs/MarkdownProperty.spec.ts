import { PropertyTypeInvalidTypeError } from '../errors';
import { MarkdownProperty } from '../MarkdownProperty';

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
});
