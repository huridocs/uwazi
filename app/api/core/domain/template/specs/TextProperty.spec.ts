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
});
