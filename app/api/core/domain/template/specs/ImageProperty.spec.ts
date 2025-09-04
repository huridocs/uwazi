import { PropertyTypeInvalidTypeError } from '../errors';
import { ImageProperty } from '../ImageProperty';

describe('ImageProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new ImageProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'image',
    });
  });

  it('should throw if providing a type different from image', () => {
    expect(
      () => new ImageProperty({ id: 'any', label: 'A label', type: 'text', template: 'any' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'ImageProperty'));
  });
});
