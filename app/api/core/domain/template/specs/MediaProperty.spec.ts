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

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single media value', () => {
      const media = new MediaProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(
        media.createPropertyAssignment({
          value: [
            {
              value:
                '(https://www.youtube.com/watch?v=kvX9Hbg7q88, {"timelinks":{"00:00:00":"title"}})',
            },
          ],
        })
      ).toEqual({
        name: media.name,
        type: media.type,
        value: [
          {
            value:
              '(https://www.youtube.com/watch?v=kvX9Hbg7q88, {"timelinks":{"00:00:00":"title"}})',
          },
        ],
      });

      expect(
        media.createPropertyAssignment({
          value: [
            {
              value: '(/api/files/media.mp4, {"timelinks":{"00:00:00":"title"}})',
            },
          ],
        })
      ).toEqual({
        name: media.name,
        type: media.type,
        value: [
          {
            value: '(/api/files/media.mp4, {"timelinks":{"00:00:00":"title"}})',
          },
        ],
      });
    });

    it('should assign File path', () => {
      const media = new MediaProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(media.assignFilePath('file.mp4', '{"timelinks":{"00:00:00":"title"}}')).toEqual(
        '(/api/files/file.mp4, {"timelinks":{"00:00:00":"title"}})'
      );

      expect(media.assignFilePath('file.mp4')).toEqual('/api/files/file.mp4');
    });

    it('should allow empty value when not required', () => {
      const media = new MediaProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = media.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: media.name, type: media.type, value: [] });
    });

    it('should throw if more than one value is provided', () => {
      const media = new MediaProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        media.createPropertyAssignment({ value: [{ value: 'a.mp4' }, { value: 'b.mp4' }] })
      ).toThrow('Media Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const media = new MediaProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => media.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Media Property is required'
      );
    });
  });
});
