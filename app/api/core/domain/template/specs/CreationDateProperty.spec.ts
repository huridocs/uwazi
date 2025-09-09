import {
  CreationDatePropertyInvalidNameError,
  CreationDatePropertyInvalidTypeError,
} from '../errors';
import { CreationDateProperty } from '../CreationDateProperty';

describe('CreationDateProperty', () => {
  it('should set defaults values if not provided', () => {
    const creationDateProperty = new CreationDateProperty({
      id: 'any_id',
      label: 'Date Added',
      template: 'any',
    });

    expect(creationDateProperty).toMatchObject({
      prioritySorting: false,
      type: 'date',
    });

    expect(creationDateProperty.name).toBe('creationDate');
  });

  it('should throw if providing a type different from date', () => {
    expect(
      () =>
        new CreationDateProperty({
          id: 'any',
          label: 'A label',
          type: 'text',
          template: 'any',
        })
    ).toThrow(new CreationDatePropertyInvalidTypeError('text'));
  });

  it('should throw if providing a PropertyName different from creationDate', () => {
    expect(
      () =>
        new CreationDateProperty({
          id: 'any',
          label: 'A label',
          name: 'A wrong name',
          template: 'any',
        })
    ).toThrow(new CreationDatePropertyInvalidNameError('A wrong name'));
  });
});
