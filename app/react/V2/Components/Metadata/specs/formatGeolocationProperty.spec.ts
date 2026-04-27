import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';
import { formatGeolocationProperty } from '../Formatters/formatGeolocationProperty.js';

describe('formatGeolocationProperty', () => {
  const metadata = {
    locationA: [
      { value: { lat: 10, lon: 20 }, label: 'Point A' },
      { value: { lat: 11, lon: 21 } },
      { value: { lat: null, lon: 0 } },
    ],
    locationB: [{ value: { lat: -5, lon: -6 }, label: 'Point B', color: '#ff0000' }],
  } as Entity['metadata'];

  it('should return null for non-geolocation properties', () => {
    const property = {
      _id: 'text1',
      name: 'title',
      label: 'Title',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadata)).toBeNull();
  });

  it('should format a simple geolocation property', () => {
    const property = {
      _id: 'geo1',
      name: 'locationA',
      label: 'Location A',
      type: 'geolocation',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadata)).toEqual({
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

    expect(formatGeolocationProperty(property, metadata)).toEqual({
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
    });
  });

  it('should return empty values for missing metadata keys', () => {
    const property = {
      _id: 'geo2',
      name: 'missingLocation',
      label: 'Missing Location',
      type: 'geolocation',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, metadata)).toEqual({
      _id: 'geo2',
      name: 'missingLocation',
      label: 'Missing Location',
      type: 'geolocation',
      values: [],
    });
  });
});
