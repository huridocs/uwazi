import { PropertyTypeInvalidTypeError } from '../errors';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty';

describe('MultiDateRangeProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MultiDateRangeProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'multidaterange',
    });
  });

  it('should throw if providing a type different from multidaterange', () => {
    expect(
      () =>
        new MultiDateRangeProperty({
          id: 'any',
          label: 'A label',
          type: 'text',
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MultiDateRangeProperty'));
  });
});
