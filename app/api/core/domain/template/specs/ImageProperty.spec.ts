import { PropertyTypeInvalidTypeError } from '../errors';
import { ImageProperty } from '../ImageProperty';
import { PropertyTypeEnum } from '../PropertyType';

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
      () =>
        new ImageProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'ImageProperty'));
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single image value', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = image.createPropertyAssignment({ value: [{ value: '  file.jpg  ' }] });

      expect(assignment).toEqual({
        name: image.name,
        type: image.type,
        value: [{ value: 'file.jpg' }],
      });
    });

    it('should allow empty value when not required', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = image.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: image.name, type: image.type, value: [] });
    });

    it('should throw if more than one value is provided', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        image.createPropertyAssignment({ value: [{ value: 'a.jpg' }, { value: 'b.jpg' }] })
      ).toThrow('Image Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const image = new ImageProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => image.createPropertyAssignment({ value: [] })).toThrow(
        'Image Property is required'
      );
    });

    it('should throw when provided value is empty string or whitespace', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() => image.createPropertyAssignment({ value: [{ value: '' }] })).toThrow(
        'Image Property must be a non-empty string.'
      );
      expect(() => image.createPropertyAssignment({ value: [{ value: '   ' }] })).toThrow(
        'Image Property must be a non-empty string.'
      );
    });
  });
});
