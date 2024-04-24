import { EntitySchema } from 'shared/types/entityType';
import { update } from '../formatter';

describe('update entity', () => {
  let entity: EntitySchema;

  beforeEach(() => {
    entity = {
      _id: '1',
      title: 'Entity original title',
      metadata: { textProperty: [{ value: 'property 1 value' }], otherProperty: [{ value: 5 }] },
    };
  });

  it('should update the title', () => {
    const result = update(entity, { title: 'new title' });
    expect(result).toEqual({ ...entity, title: 'new title' });
  });

  it('should update existing metadata', () => {
    const result = update(entity, { properties: [{ textProperty: 'new value' }] });
    expect(result).toEqual({
      ...entity,
      metadata: { textProperty: [{ value: 'new value' }], otherProperty: [{ value: 5 }] },
    });
  });

  it('should add new metadata', () => {
    const result = update(entity, { properties: [{ newProperty: 6 }] });
    expect(result).toEqual({
      ...entity,
      metadata: { ...entity.metadata, newProperty: [{ value: 6 }] },
    });
  });

  it('should clear a metadata value', () => {
    expect(update(entity, { properties: [{ textProperty: undefined }] })).toEqual({
      ...entity,
      metadata: { otherProperty: [{ value: 5 }] },
    });

    expect(update(entity, { properties: [{ newProperty: 6 }, { textProperty: '' }] })).toEqual({
      ...entity,
      metadata: { newProperty: [{ value: 6 }], otherProperty: [{ value: 5 }] },
    });
  });

  it('should handle array of values', () => {
    const result = update(entity, { properties: [{ multiselect: ['A', 'B'] }] });
    expect(result).toEqual({
      ...entity,
      metadata: {
        textProperty: [{ value: 'property 1 value' }],
        otherProperty: [{ value: 5 }],
        multiselect: [{ value: 'A' }, { value: 'B' }],
      },
    });
  });
});
