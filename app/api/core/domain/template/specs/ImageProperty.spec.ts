import { PropertyTypeInvalidTypeError } from '../errors.js';
import { ImageProperty } from '../ImageProperty.js';
import { PropertyTypeEnum } from '../PropertyType.js';

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
    it('should create from an URL', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = image.createPropertyAssignment({
        value: [{ value: 'http://url.to/image.png' }],
      });

      const assignment2 = image.createPropertyAssignment({
        value: [{ value: 'https://url.to/image.png' }],
      });

      expect(assignment).toEqual({
        name: image.name,
        type: image.type,
        isTranslatable: true,
        value: [{ value: 'http://url.to/image.png' }],
      });

      expect(assignment2).toEqual({
        name: image.name,
        type: image.type,
        isTranslatable: true,
        value: [{ value: 'https://url.to/image.png' }],
      });
    });

    it('should prepend "/api/files/" if is not an URL ', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(
        image.createPropertyAssignment({
          value: [{ value: 'file.jpg' }],
        })
      ).toEqual({
        isTranslatable: true,
        name: image.name,
        type: image.type,
        value: [{ value: '/api/files/file.jpg' }],
      });

      expect(
        image.createPropertyAssignment({
          value: [{ value: 'https://domain.com/file.jpg' }],
        })
      ).toEqual({
        isTranslatable: true,
        name: image.name,
        type: image.type,
        value: [{ value: 'https://domain.com/file.jpg' }],
      });

      expect(
        image.createPropertyAssignment({
          value: [{ value: '/api/files/file.jpg' }],
        })
      ).toEqual({
        isTranslatable: true,
        name: image.name,
        type: image.type,
        value: [{ value: '/api/files/file.jpg' }],
      });
    });

    it('should throw if url is invalid', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        image.createPropertyAssignment({
          value: [{ value: 'http' }],
        })
      ).toThrow('Image Property must be a valid URL.');

      expect(() =>
        image.createPropertyAssignment({
          value: [{ value: 'https' }],
        })
      ).toThrow('Image Property must be a valid URL.');
    });

    it('should create assignment with a single image value', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = image.createPropertyAssignment({ value: [{ value: '  file.jpg  ' }] });

      expect(assignment).toEqual({
        name: image.name,
        type: image.type,
        isTranslatable: true,
        value: [{ value: '/api/files/file.jpg' }],
      });
    });

    it('should allow empty value when not required', () => {
      const image = new ImageProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = image.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({
        name: image.name,
        type: image.type,
        isTranslatable: true,
        value: [],
      });
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

      expect(() => image.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Image Property is required'
      );
    });

    it('should throw when provided value is empty string or whitespace', () => {
      const image = new ImageProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => image.createPropertyAssignment({ value: [{ value: '' }] }, true)).toThrow(
        'Image Property is required'
      );
      expect(() => image.createPropertyAssignment({ value: [{ value: '   ' }] }, true)).toThrow(
        'Image Property must be a non-empty string.'
      );
    });
  });
});
