import { formatMetadataForForm } from '../formatMetadataForForm.js';
import { entity, fixtures } from './fixtures.js';
import { toMetadataObjectSchema } from '../toMetadataObjectSchema.js';

describe('toMetadataObjectSchema', () => {
  it.each(fixtures)(
    'should format $property.type metadata from form values for $property.name',
    ({ property, expected }) => {
      const formMetadata = formatMetadataForForm([property], entity.metadata);

      expect((formMetadata[property.name] ?? []).map(toMetadataObjectSchema)).toEqual(expected);
    }
  );

  it('should return relationship values as sharedId only', () => {
    expect(
      toMetadataObjectSchema({
        value: 'shared-target-1',
        label: 'Related entity title',
        type: 'entity',
        parent: { label: 'Ignored parent', value: 'ignored-parent' },
        inheritedType: 'relationship',
      })
    ).toEqual({
      value: 'shared-target-1',
    });
  });

  it('should normalize malformed daterange and link objects', () => {
    expect(
      toMetadataObjectSchema({
        value: { from: '100', to: 200 },
      })
    ).toEqual({
      value: { from: undefined, to: 200 },
    });

    expect(
      toMetadataObjectSchema({
        value: { label: 10, url: 'https://example.org' },
      })
    ).toEqual({
      value: { label: undefined, url: 'https://example.org' },
    });
  });

  it('should normalize geolocation arrays and reject mixed arrays', () => {
    expect(
      toMetadataObjectSchema({
        value: { lat: 12.34, lon: 56.78, label: 'Point A' },
      })
    ).toEqual({
      value: { lat: 12.34, lon: 56.78, label: 'Point A' },
    });

    expect(
      toMetadataObjectSchema({
        value: [
          { lat: 1, lon: 2, label: 'A' },
          { lat: 3, lon: 4 },
        ],
      })
    ).toEqual({
      value: [
        { lat: 1, lon: 2, label: 'A' },
        { lat: 3, lon: 4, label: undefined },
      ],
    });

    expect(
      toMetadataObjectSchema({
        value: [
          { lat: 1, lon: 2 },
          { lat: 'x', lon: 4 },
        ],
      })
    ).toEqual({ value: null });
  });

  it('should preserve nested row objects on save', () => {
    expect(
      toMetadataObjectSchema({
        value: { daddh: ['Art. 1'], dple: ['Art. 2'] },
      })
    ).toEqual({
      value: { daddh: ['Art. 1'], dple: ['Art. 2'] },
    });
  });

  it('should sanitize parent and inheritedValue recursively', () => {
    expect(
      toMetadataObjectSchema({
        value: 'entity-1',
        inheritedType: 'relationship',
        parent: { label: 'Parent', value: 100 },
        inheritedValue: [
          {
            value: { random: 'unsupported' },
            label: 'Nested',
            parent: { label: 'Nested Parent', value: 'nested-parent' },
            color: '#00ff00',
          },
        ],
      })
    ).toEqual({
      value: 'entity-1',
      inheritedType: 'relationship',
      inheritedValue: [
        {
          value: null,
          label: 'Nested',
          parent: { label: 'Nested Parent', value: 'nested-parent' },
        },
      ],
    });
  });

  it('should fallback unsupported value shapes to null', () => {
    expect(
      toMetadataObjectSchema({
        value: { any: 'unsupported-shape' },
      })
    ).toEqual({
      value: null,
    });
  });
});
