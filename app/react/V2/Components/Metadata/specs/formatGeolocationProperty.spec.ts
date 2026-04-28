import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';
import { formatGeolocationProperty } from '../Formatters/formatGeolocationProperty.js';

describe('formatGeolocationProperty', () => {
  const metadataA = {
    locationA: [
      { value: { lat: 10, lon: 20 }, label: 'Point A' },
      { value: { lat: 11, lon: 21 } },
      { value: { lat: null, lon: 0 } },
    ],
    locationB: [{ value: { lat: -5, lon: -6 }, label: 'Point B', color: '#ff0000' }],
  } as Entity['metadata'];

  const metadataB = {
    locationB: [{ value: { lat: -5, lon: -6 }, label: 'Point B', color: '#ff0000' }],
    rel_1: [
      {
        value: '1',
        label: 'Location 1',
        type: 'entity',
        inheritedType: 'geolocation',
        inheritedValue: [
          {
            value: {
              lat: 10,
              lon: 20,
            },
          },
        ],
        icon: {
          _id: 'star',
          type: 'Icons',
          label: 'Star',
        },
      },
      {
        value: '2',
        label: 'Location 2',
        type: 'entity',
        inheritedType: 'geolocation',
        inheritedValue: [
          {
            value: {
              lat: 11,
              lon: 21,
            },
          },
        ],
      },
    ],
  } as Entity['metadata'];

  const metadataC = {
    locationB: [{ value: { lat: -5, lon: -6 }, label: 'Point B', color: '#ff0000' }],
    rel_nested: [
      {
        value: '3',
        label: 'Location 3',
        type: 'entity',
        inheritedType: 'relationship',
        inheritedValue: [
          {
            value: 'level-1',
            inheritedType: 'relationship',
            inheritedValue: [
              {
                value: 'level-2',
                inheritedType: 'relationship',
                inheritedValue: [
                  {
                    value: 'level-3',
                    inheritedType: 'relationship',
                    inheritedValue: [
                      {
                        value: 'leaf',
                        inheritedType: 'geolocation',
                        inheritedValue: [{ value: { lat: 48.8566, lon: 2.3522 } }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as Entity['metadata'];

  it('should return null for non-geolocation properties', () => {
    const property = {
      _id: 'text1',
      name: 'title',
      label: 'Title',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataA)).toBeNull();
  });

  it('should format a simple geolocation property', () => {
    const property = {
      _id: 'geo1',
      name: 'locationA',
      label: 'Location A',
      type: 'geolocation',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataA)).toEqual({
      _id: 'geo1',
      name: 'locationA',
      label: 'Location A',
      type: 'geolocation',
      values: [
        { value: { latitude: 10, longitude: 20 }, label: 'Point A' },
        { value: { latitude: 11, longitude: 21 }, label: 'Location A' },
      ],
    });
  });

  it('should format grouped geolocation properties and merge all group values', () => {
    const property = {
      _id: 'group1',
      name: 'group1',
      label: 'group1',
      type: 'geolocation',
      propertyGroup: [
        { name: 'locationA', label: 'Location A' },
        { name: 'locationB', label: 'Location B' },
      ],
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataA)).toEqual({
      _id: 'group1',
      name: 'group1',
      label: 'group1',
      type: 'geolocation',
      values: [
        { value: { latitude: 10, longitude: 20 }, label: 'Point A' },
        { value: { latitude: 11, longitude: 21 }, label: 'Location A' },
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Point B',
          color: '#ff0000',
        },
      ],
      propertyGroup: [
        { name: 'locationA', label: 'Location A' },
        { name: 'locationB', label: 'Location B' },
      ],
    });
  });

  it('should format grouped geolocations with inherited values', () => {
    const property = {
      _id: 'group1',
      name: '__group1',
      label: '__group1',
      type: 'geolocation',
      inherited: false,
      inheritedType: undefined,
      propertyGroup: [
        { name: 'locationB', label: 'Location B' },
        {
          name: 'rel_1',
          label: 'Rel 1',
          inherited: true,
          content: '69f0a4ac62c282d87ef5970f',
          property: 'x',
        },
      ],
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataB)).toEqual({
      _id: 'group1',
      name: '__group1',
      label: '__group1',
      type: 'geolocation',
      propertyGroup: [
        { name: 'locationB', label: 'Location B' },
        {
          name: 'rel_1',
          label: 'Rel 1',
          inherited: true,
          content: '69f0a4ac62c282d87ef5970f',
          property: 'x',
        },
      ],
      values: [
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Point B',
          color: '#ff0000',
        },
        {
          value: { latitude: 10, longitude: 20 },
          label: 'Location 1',
          entity: {
            _id: '1',
            icon: { _id: 'star', label: 'Star' },
          },
        },
        {
          value: { latitude: 11, longitude: 21 },
          label: 'Location 2',
          entity: {
            _id: '2',
          },
        },
      ],
    });
  });

  it('should return empty values for missing metadata keys', () => {
    const property = {
      _id: 'geo2',
      name: 'missingLocation',
      label: 'Missing Location',
      type: 'geolocation',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataA)).toEqual({
      _id: 'geo2',
      name: 'missingLocation',
      label: 'Missing Location',
      type: 'geolocation',
      values: [],
    });
  });

  it('should format grouped geolocations when one property is deeply nested relationship inheritance', () => {
    const property = {
      _id: 'group2',
      name: '__group2',
      label: '__group2',
      type: 'geolocation',
      propertyGroup: [
        { name: 'locationB', label: 'Location B' },
        {
          name: 'rel_nested',
          label: 'Rel Nested',
          inherited: true,
          content: '69f0a4ac62c282d87ef5970f',
          property: 'y',
        },
      ],
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadataC)).toEqual({
      _id: 'group2',
      name: '__group2',
      label: '__group2',
      type: 'geolocation',
      propertyGroup: [
        { name: 'locationB', label: 'Location B' },
        {
          name: 'rel_nested',
          label: 'Rel Nested',
          inherited: true,
          content: '69f0a4ac62c282d87ef5970f',
          property: 'y',
        },
      ],
      values: [
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Point B',
          color: '#ff0000',
        },
        {
          value: { latitude: 48.8566, longitude: 2.3522 },
          label: 'Location 3',
          entity: {
            _id: '3',
          },
        },
      ],
    });
  });
});
