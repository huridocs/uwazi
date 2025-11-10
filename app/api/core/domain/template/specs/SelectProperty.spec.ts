import {
  FieldIsRequiredError,
  PropertyThesaurusMismatchError,
  PropertyTypeInvalidTypeError,
  PropertyTypeMismatchError,
} from '../errors';
import { MultiSelectProperty } from '../select/MultiSelectProperty';
import { SelectProperty } from '../select/SelectProperty';

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

  describe('createPropertyAssignment()', () => {
    it('should create SelectPropertyAssignment', () => {
      const select = new SelectProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        content: 'any_content',
      });

      expect(
        select.createPropertyAssignment({
          value: [{ value: 'apple_id', label: 'Apple' }],
          language: 'en',
        })
      ).toEqual({
        language: 'en',
        name: select.name,
        type: select.type,
        value: [{ value: 'apple_id', label: 'Apple' }],
      });

      expect(
        select.createPropertyAssignment({
          value: [
            { value: 'apple_id', label: 'Apple', parent: { value: 'group_id', label: 'A Title' } },
          ],
          language: 'en',
        })
      ).toEqual({
        language: 'en',
        name: select.name,
        type: select.type,
        value: [
          { value: 'apple_id', label: 'Apple', parent: { value: 'group_id', label: 'A Title' } },
        ],
      });
    });

    it('should throw if more than one value is provided', () => {
      const select = new SelectProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        content: 'any_content',
      });

      expect(() =>
        select.createPropertyAssignment({
          value: ['apple_id', 'banana_id'].map(id => ({ value: id, label: id })),
          language: 'en',
        })
      ).toThrow();
    });

    it('should throw if required and no value is provided', () => {
      const select = new SelectProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        content: 'any_content',
        required: true,
      });

      expect(() =>
        select.createPropertyAssignment({
          value: [],
          language: 'en',
        })
      ).toThrow();
    });
  });
});
