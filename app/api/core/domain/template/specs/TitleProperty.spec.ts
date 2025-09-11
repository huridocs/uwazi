import { TitlePropertyInvalidNameError, PropertyTypeInvalidTypeError } from '../errors';
import { TitleProperty } from '../TitleProperty';

describe('TitleProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new TitleProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      prioritySorting: false,
      generatedId: false,
      type: 'text',
      isCommonProperty: true,
    });

    expect(property.name).toBe('title');
  });

  it('should throw if providing a type different from text', () => {
    expect(
      () =>
        new TitleProperty({
          id: 'any',
          isCommonProperty: true,
          label: 'A label',
          type: 'date',
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('date', 'TitleProperty'));
  });

  it('should throw if providing a PropertyName different from title', () => {
    expect(
      () =>
        new TitleProperty({
          id: 'any',
          isCommonProperty: true,
          label: 'A label',
          name: 'A wrong name',
          template: 'any',
        })
    ).toThrow(new TitlePropertyInvalidNameError('A wrong name'));
  });
});
