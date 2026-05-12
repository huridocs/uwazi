import type { Entity } from '#V2/api/entities/types.js';
import type { BaseMetadataProperty } from '../../types.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from '../resolvePropertyMetadataValues.js';

describe('resolvePropertyMetadataValues', () => {
  it('should return original values for non-inherited properties', () => {
    const property = {
      _id: 'p1',
      name: 'simple_text',
      label: 'Simple text',
      type: 'text',
    } as BaseMetadataProperty;

    const metadata = {
      simple_text: [{ value: 'A value' }],
    } as Entity['metadata'];

    expect(resolvePropertyMetadataValues(property, metadata)).toEqual([{ value: 'A value' }]);
    expect(resolvePropertyType(property, metadata)).toBe('text');
  });

  it('should resolve deep inherited relationship chains to terminal values', () => {
    const property = {
      _id: 'p2',
      name: 'hierarchical_relationships',
      label: 'Hierarchical relationships',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
    } as BaseMetadataProperty;

    const metadata = {
      hierarchical_relationships: [
        {
          value: 'entity-a',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              value: 'entity-b',
              inheritedType: 'relationship',
              inheritedValue: [
                {
                  value: 'entity-c',
                  inheritedType: 'multiselect',
                  inheritedValue: [
                    { value: 'thes.1', label: 'First' },
                    { value: 'thes.2', label: 'Second' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as Entity['metadata'];

    expect(resolvePropertyMetadataValues(property, metadata)).toEqual([
      { value: 'thes.1', label: 'First' },
      { value: 'thes.2', label: 'Second' },
    ]);
    expect(resolvePropertyType(property, metadata)).toBe('multiselect');
  });

  it('should resolve type and values across sibling branches with consistent inherited type', () => {
    const property = {
      _id: 'p3',
      name: 'conflicting_relationships',
      label: 'Conflicting relationships',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
    } as BaseMetadataProperty;

    const metadata = {
      conflicting_relationships: [
        {
          value: 'entity-1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              value: 'entity-1-a',
              inheritedType: 'date',
              inheritedValue: [{ value: 1717200000 }],
            },
          ],
        },
        {
          value: 'entity-2',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              value: 'entity-2-a',
              inheritedType: 'date',
              inheritedValue: [{ value: 1717286400 }],
            },
          ],
        },
      ],
    } as Entity['metadata'];

    expect(resolvePropertyMetadataValues(property, metadata)).toEqual([
      { value: 1717200000 },
      { value: 1717286400 },
    ]);
    expect(resolvePropertyType(property, metadata)).toBe('date');
  });

  it('should keep configured inherited type for empty inherited arrays', () => {
    const property = {
      _id: 'p4',
      name: 'inherited_empty',
      label: 'Inherited empty',
      type: 'relationship',
      inherited: true,
      inheritedType: 'geolocation',
    } as BaseMetadataProperty;

    const metadata = {
      inherited_empty: [],
    } as Entity['metadata'];

    expect(resolvePropertyMetadataValues(property, metadata)).toEqual([]);
    expect(resolvePropertyType(property, metadata)).toBe('geolocation');
  });

  it('should ignore inherited flags on non-relationship properties', () => {
    const property = {
      _id: 'p5',
      name: 'non_relationship',
      label: 'Non relationship',
      type: 'text',
      inherited: true,
      inheritedType: 'date',
    } as BaseMetadataProperty;

    const metadata = {
      non_relationship: [{ value: 'raw text' }],
    } as Entity['metadata'];

    expect(resolvePropertyMetadataValues(property, metadata)).toEqual([{ value: 'raw text' }]);
    expect(resolvePropertyType(property, metadata)).toBe('text');
  });
});
