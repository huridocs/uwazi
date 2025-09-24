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
      template: 'any',
    });

    expect(creationDateProperty).toMatchObject({
      prioritySorting: false,
      type: 'date',
    });

    // @ts-expect-error TS(2339): Property 'name' does not exist on type 'ModifiedDa... Remove this comment to see the full error message
    expect(creationDateProperty.name).toBe('editDate');
  });

  it('should throw if providing a type different from date', () => {
    expect(
      () =>
        new ModifiedDateProperty({
          id: 'any',
          label: 'A label',
          type: 'text',
          template: 'any',
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
          template: 'any',
        })
    ).toThrow(new ModifiedDatePropertyInvalidNameError('A wrong name'));
  });
});
