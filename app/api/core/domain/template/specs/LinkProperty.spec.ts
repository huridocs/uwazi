import { PropertyTypeInvalidTypeError } from '../errors';
import { LinkProperty } from '../LinkProperty';

describe('LinkProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new LinkProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'link',
    });
  });

  it('should throw if providing a type different from link', () => {
    expect(
      () => new LinkProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'LinkProperty'));
  });
});
