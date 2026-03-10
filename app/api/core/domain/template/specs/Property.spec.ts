import { Property } from 'api/core/domain/template/Property';
import { PropertyTypeMismatchError } from '../errors';

describe('Property', () => {
  it('should set defaults values if not provided', () => {
    const property = new Property({
      id: 'any_id',
      label: 'A Title',
      type: 'text',
      template: 'any',
    });

    expect(property).toMatchObject({
      noLabel: false,
      required: false,
      showInCard: false,
    });
  });

  it('should generate a PropertyName ONLY when none is provided', () => {
    const property1 = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text Property',
      template: 'any',
    });
    const property2 = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text Property 2',
      name: 'a_text_property',
      template: 'any',
    });

    expect(property1.name).toBe('a_text_property');

    expect(property2.name).toBe('a_text_property');
  });

  it('equals should return true if both Type and PropertyName are equal', () => {
    const textProperty = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text',
      template: 'any',
    });

    const text1Property = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text',
      template: 'any',
    });

    const text2Property = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text 2',
      template: 'any',
    });

    expect(textProperty.equals(text1Property)).toBe(true);

    expect(textProperty.equals(text2Property)).toBe(false);
  });

  it('should throw a type mismatch error when property types are inconsistent', () => {
    const dateProperty = new Property({ id: '', label: 'label', template: '', type: 'date' });
    const textProperty = new Property({ id: '', label: 'label', template: '', type: 'text' });

    expect(() => dateProperty.ensurePropertyIsConsistent(textProperty)).toThrow(
      new PropertyTypeMismatchError(dateProperty, textProperty)
    );

    expect(() => dateProperty.ensurePropertyIsConsistent(dateProperty)).not.toThrow(
      new PropertyTypeMismatchError(dateProperty, textProperty)
    );
  });
});
