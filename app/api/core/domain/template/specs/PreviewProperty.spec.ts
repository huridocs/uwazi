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

      const assignment = preview.createPropertyAssignment();

      expect(assignment).toEqual({
        name: preview.name,
        type: preview.type,
        value: [],
      });
    });
  });
});
