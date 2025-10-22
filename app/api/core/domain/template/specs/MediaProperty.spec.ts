import { PropertyTypeInvalidTypeError } from '../errors';
import { MediaProperty } from '../MediaProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('MediaProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MediaProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'media',
      fullWidth: false,
    });
  });

  it('should throw if providing a type different from media', () => {
    expect(
      () =>
        new MediaProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MediaProperty'));
  });
});
