import {
  FieldIsRequiredError,
  PropertyThesaurusMismatchError,
  PropertyTypeInvalidTypeError,
  PropertyTypeMismatchError,
} from '../errors';
import { MultiSelectProperty } from '../MultiSelectProperty';
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

  it('should throw a type mismatch error when property types are inconsistent', () => {
    const wrongSelect = new SelectProperty({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
    });
    (wrongSelect as any).type = 'date';

    const select = new SelectProperty({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
    });

    expect(() => select.ensurePropertyIsConsistent(wrongSelect)).toThrow(
      new PropertyTypeMismatchError(select, wrongSelect)
    );
  });

  it('should throw a thesaurus mismatch error when property thesaurus are inconsistent', () => {
    const wrongSelect = new SelectProperty({
      id: '',
      label: 'label',
      template: '',
      content: 'wrong',
    });

    const select = new SelectProperty({
      id: '',
      label: 'label',
      template: '',
      content: 'content',
    });

    expect(() => select.ensurePropertyIsConsistent(wrongSelect)).toThrow(
      new PropertyThesaurusMismatchError(select, wrongSelect)
    );

    expect(() => select.ensurePropertyIsConsistent(select)).not.toThrow();
  });

  it('should ensure MultiSelectProperty and SelectProperty are compatible to each other', () => {
    const select = new SelectProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
      content: 'any_content',
    });

    const multiSelect = new MultiSelectProperty({
      id: 'any_id_2',
      label: 'A Title',
      template: 'any',
      content: 'any_content',
    });

    expect(() => select.ensurePropertyIsConsistent(multiSelect)).not.toThrow();
    expect(() => multiSelect.ensurePropertyIsConsistent(select)).not.toThrow();
  });
});
