import { PropertyTypeInvalidTypeError } from '../errors';
import { NumericProperty } from '../NumericProperty';

describe('NumericProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new NumericProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'numeric',
    });
  });

  it('should throw if providing a type different from numeric', () => {
    expect(
      () => new NumericProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'NumericProperty'));
  });
});
