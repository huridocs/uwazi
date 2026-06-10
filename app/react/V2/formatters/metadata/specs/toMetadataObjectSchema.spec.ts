import { toMetadataObjectSchema } from '../toMetadataObjectSchema.js';

describe('toMetadataObjectSchema', () => {
  it('should keep primitive values and drop UI-only fields', () => {
    expect(
      toMetadataObjectSchema({
        value: 'hello',
        label: 'Hello',
        color: '#ff0000',
        authorized: false,
        icon: { _id: 'x' },
        type: 'relationship',
      })
    ).toEqual({
      value: 'hello',
      label: 'Hello',
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
