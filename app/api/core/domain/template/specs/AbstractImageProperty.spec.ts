import {
  AbstractImageProperty,
  ImageStyle,
} from '#api/core/domain/template/AbstractImageProperty.js';
import { InvalidStyleTypeError } from '#api/core/domain/template/errors.js';

class Testing extends AbstractImageProperty {}

describe('AbstractImageProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new Testing({
      id: 'any_id',
      label: 'A Title',
      type: 'image',
      template: 'any',
    });

    expect(property).toMatchObject({
      style: ImageStyle.Cover,
      fullWidth: false,
    });
  });

  it('should throw if providing a style type different from ImageStyle', () => {
    expect(
      () =>
        new Testing({
          id: 'any',
          label: 'A label',
          type: 'image',
          style: 'any' as any,
          template: '',
        })
    ).toThrow(new InvalidStyleTypeError('any'));
  });
});
