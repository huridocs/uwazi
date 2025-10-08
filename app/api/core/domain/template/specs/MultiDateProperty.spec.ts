import { DateProperty } from '../DateProperty';
import { PropertyTypeInvalidTypeError } from '../errors';
import { MultiDateProperty } from '../MultiDateProperty';

describe('MultiDateProperty', () => {
  it('should set defaults values if not provided', () => {
    const property = new MultiDateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    expect(property).toMatchObject({
      type: 'multidate',
    });
  });

  it('should throw if providing a type different from multidate', () => {
    expect(
      () => new MultiDateProperty({ id: 'any', label: 'A label', type: 'text', template: '' })
    ).toThrow(new PropertyTypeInvalidTypeError('text', 'MultiDateProperty'));
  });

  it('should ensure DateProperty is compatible to MultiDateProperty', () => {
    const date = new DateProperty({
      id: 'any_id',
      label: 'A Title',
      template: 'any',
    });

    const multiDate = new MultiDateProperty({
      id: 'any_id_2',
      label: 'A Title',
      template: 'any',
    });

    expect(() => multiDate.ensurePropertyIsConsistent(date)).not.toThrow();
  });
});
