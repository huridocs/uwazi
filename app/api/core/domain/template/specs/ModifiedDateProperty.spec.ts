import {
  ModifiedDatePropertyInvalidNameError,
  ModifiedDatePropertyInvalidTypeError,
} from '../errors';
import { ModifiedDateProperty } from '../ModifiedDateProperty';

describe('ModifiedDateProperty', () => {
  it('should set defaults values if not provided', () => {
    const creationDateProperty = new ModifiedDateProperty({
      id: 'any_id',
      label: 'Date Modified',
    });

    expect(creationDateProperty).toMatchObject({
      prioritySorting: false,
      type: 'date',
    });

    expect(creationDateProperty.name.value).toBe('editDate');
  });

  it('should throw if providing a type different from date', () => {
    expect(
      () =>
        new ModifiedDateProperty({
          id: 'any',
          label: 'A label',
          type: 'text',
        })
    ).toThrow(new ModifiedDatePropertyInvalidTypeError('text'));
  });

  it('should throw if providing a PropertyName different from editDate', () => {
    expect(
      () =>
        new ModifiedDateProperty({
          id: 'any',
          label: 'Date Modified',
          name: 'A wrong name',
        })
    ).toThrow(new ModifiedDatePropertyInvalidNameError('A wrong name'));
  });
});
