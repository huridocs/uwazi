import { PropertyTypeInvalidTypeError } from '../errors';
import { MultiDateProperty } from '../MultiDateProperty';

describe('MultiDateProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MultiDateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'multidate',
    });
  });

  it('should throw if providing a type different from multidate', () => {
    expect(
      () => new MultiDateProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MultiDateProperty'));
  });
});
