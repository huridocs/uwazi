import { PropertyTypeInvalidTypeError } from '../errors';
import { PreviewProperty } from '../PreviewProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('PreviewProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new PreviewProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'preview',
    });
  });

  it('should throw if providing a type different from preview', () => {
    expect(
      () =>
        new PreviewProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: 'any',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'PreviewProperty'));
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single preview value', () => {
      const preview = new PreviewProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = preview.createPropertyAssignment({ value: [{ value: 'file.jpg' }] });

      expect(assignment).toEqual({
        name: preview.name,
        type: preview.type,
        value: [{ value: 'file.jpg' }],
      });
    });

    it('should allow empty value when not required', () => {
      const preview = new PreviewProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = preview.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: preview.name, type: preview.type, value: [] });
    });

    it('should throw if more than one value is provided', () => {
      const preview = new PreviewProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        preview.createPropertyAssignment({ value: [{ value: 'a.jpg' }, { value: 'b.jpg' }] })
      ).toThrow('Preview Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const preview = new PreviewProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => preview.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Preview Property is required'
      );
    });
  });
});
