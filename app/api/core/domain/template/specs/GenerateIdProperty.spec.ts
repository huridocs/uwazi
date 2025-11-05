import { PropertyTypeInvalidTypeError } from '../errors';
import { GenerateIdProperty } from '../GenerateIdProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('GenerateIdProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new GenerateIdProperty({
      id: 'any_id',
      template: 'any',
      label: 'A Label',
    });

    expect(property).toMatchObject({
      type: 'generatedid',
    });
  });

  it('should throw if providing a type different from generatedid', () => {
    expect(
      () =>
        new GenerateIdProperty({
          id: 'any',
          label: 'A label',
          type: PropertyTypeEnum.Text as any,
          template: '',
        })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'GenerateIdProperty'));
  });

  describe('createPropertyAssignment()', () => {
    it('should create assignment with a provided id', () => {
      const prop = new GenerateIdProperty({ id: 'any_id', template: 'any', label: 'A Label' });

      const assignment = prop.createPropertyAssignment({ value: [{ value: 'CPW6528-7568' }] });

      expect(assignment).toEqual({
        name: prop.name,
        type: prop.type,
        value: [{ value: 'CPW6528-7568' }],
      });
    });

    it('should auto-generate an id when value is empty', () => {
      const prop = new GenerateIdProperty({ id: 'any_id', template: 'any', label: 'A Label' });

      const assignment = prop.createPropertyAssignment({ value: [] });

      expect(assignment.name).toBe(prop.name);
      expect(assignment.type).toBe(prop.type);
      expect(assignment.value).toHaveLength(1);
      expect(typeof assignment.value[0].value).toBe('string');
      // generateID(3, 4, 4) => total length 3 + 4 + (4 + 1) = 12
      expect(assignment.value[0].value.length).toBe(12);
    });

    it('should auto-generate an id when required and empty', () => {
      const prop = new GenerateIdProperty({
        id: 'any_id',
        template: 'any',
        label: 'A Label',
        required: true,
      });

      const assignment = prop.createPropertyAssignment({ value: [] });

      expect(assignment.value).toHaveLength(1);
      expect(typeof assignment.value[0].value).toBe('string');
      expect(assignment.value[0].value.length).toBe(12);
    });

    it('should throw if more than one value is provided', () => {
      const prop = new GenerateIdProperty({ id: 'any_id', template: 'any', label: 'A Label' });

      expect(() =>
        prop.createPropertyAssignment({ value: [{ value: 'A' }, { value: 'B' }] })
      ).toThrow('Generated ID Property only accepts a single value.');
    });
  });
});
