import { NestedProperty } from '../NestedProperty';

describe('NestedProperty', () => {
  it('should include nested type at the end of the PropertyName', () => {
    const nestedProperty = new NestedProperty({
      id: 'any_id',
      label: 'A label',
      type: 'nested',
      template: 'any',
    });

    expect(nestedProperty.name).toBe('a_label_nested');
  });

  it('should not generate a PropertyName if one is provided', () => {
    const nestedProperty = new NestedProperty({
      id: 'any_id',
      label: 'A label',
      type: 'nested',
      name: 'a_label_2_nested',
      template: 'any',
    });

    expect(nestedProperty.name).toBe('a_label_2_nested');
  });
});
