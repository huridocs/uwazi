import { PropertyTypeInvalidTypeError } from '../errors';
import { LinkProperty } from '../LinkProperty';
import { PropertyTypeEnum } from '../PropertyType';

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
      () =>
        new LinkProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'LinkProperty'));
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a single link value (with label)', () => {
      const link = new LinkProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = link.createPropertyAssignment({
        value: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
      });

      expect(assignment).toEqual({
        name: link.name,
        type: link.type,
        value: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
      });
    });

    it('should allow empty value when not required', () => {
      const link = new LinkProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      const assignment = link.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: link.name, type: link.type, value: [] });
    });

    it('should throw if more than one value is provided', () => {
      const link = new LinkProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        link.createPropertyAssignment({
          value: [
            { value: { url: 'https://uwazi.io', label: 'Uwazi' } },
            { value: { url: 'https://huridocs.org', label: 'HURIDOCS' } },
          ],
        })
      ).toThrow('Link Property only accepts a single value.');
    });

    it('should throw if required and no value is provided', () => {
      const link = new LinkProperty({
        id: 'any_id',
        label: 'A Title',
        template: 'any',
        required: true,
      });

      expect(() => link.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Link Property is required'
      );
    });

    it('should throw if url is invalid', () => {
      const link = new LinkProperty({ id: 'any_id', label: 'A Title', template: 'any' });

      expect(() =>
        link.createPropertyAssignment({ value: [{ value: { url: 'not-a-url' } }] })
      ).toThrow();
    });
  });
});
