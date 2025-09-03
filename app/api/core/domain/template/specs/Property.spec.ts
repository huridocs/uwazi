import { Property } from 'api/templates.v2/model/Property';

describe('Property', () => {
  it('should set defaults values if not provided', () => {
    const property = new Property({
      id: 'any_id',
      label: 'A Title',
      type: 'text',
    });

    expect(property).toMatchObject({
      noLabel: false,
      required: false,
      showInCard: false,
    });
  });

  it('should generate a PropertyName ONLY when none is provided', () => {
    const property1 = new Property({ id: 'any_id', type: 'text', label: 'A Text Property' });
    const property2 = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text Property 2',
      name: 'a_text_property',
    });

    expect(property1.name.value).toBe('a_text_property');

    expect(property2.name.value).toBe('a_text_property');
  });

  it('equals should return true if both Type and PropertyName are equal', () => {
    const textProperty = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text',
    });

    const text1Property = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text',
    });

    const text2Property = new Property({
      id: 'any_id',
      type: 'text',
      label: 'A Text 2',
    });

    expect(textProperty.equals(text1Property)).toBe(true);

    expect(textProperty.equals(text2Property)).toBe(false);
  });
});
