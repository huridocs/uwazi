import { FieldIsRequiredError, PropertyTypeInvalidTypeError } from '../errors';
import { SelectProperty } from '../SelectProperty';

describe('SelectProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new SelectProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
      content: 'any_content',
    });

    expect(property).toMatchObject({
      type: 'select',
    });
  });

  it('should throw if providing a type different from select', () => {
    expect(
      () =>
        new SelectProperty({
          id: 'any',
          label: 'A label',
          type: 'text' as any,
          content: 'any',
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'SelectProperty'));
  });

  it('should throw if content is missing', () => {
    expect(
      () => new SelectProperty({ id: 'any', label: 'A label', template: '', content: '' })
    ).toThrow(new FieldIsRequiredError('content'));

    expect(
      () =>
        new SelectProperty({ id: 'any', label: 'A label', template: '', content: undefined as any })
    ).toThrow(new FieldIsRequiredError('content'));
  });
});
