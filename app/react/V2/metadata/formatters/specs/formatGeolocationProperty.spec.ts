import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatGeolocationProperty } from '../formatGeolocationProperty.js';

describe('formatGeolocationProperty', () => {
  const templates = [
    {
      _id: 'entity-template',
      color: '#1A73E8',
      properties: [{ name: 'locationA' }, { name: 'locationB' }],
    },
    {
      _id: '69f0a4ac62c282d87ef5970f',
      color: '#FF6F00',
      properties: [],
    },
  ] as unknown as ClientTemplateSchema[];

  const metadataA = {
    locationA: [{ value: { lat: 10, lon: 20 } }],
    locationB: [{ value: { lat: -5, lon: -6 } }],
  } as Entity['metadata'];

  const entityA = {
    template: 'entity-template',
    metadata: metadataA,
  } as Entity;

  const metadataB = {
    locationB: [{ value: { lat: -5, lon: -6 } }],
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

  const entityB = {
    template: 'entity-template',
    metadata: metadataB,
  } as Entity;

  const metadataC = {
    locationB: [{ value: { lat: -5, lon: -6 } }],
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

  const entityC = {
    template: 'entity-template',
    metadata: metadataC,
  } as Entity;

  it('should format a simple geolocation property', () => {
    const property = {
      _id: 'geo1',
      name: 'locationA',
      label: 'Location A',
      type: 'geolocation',
    } as BaseMetadataProperty;

    expect(formatGeolocationProperty(property, entityA, templates)).toEqual({
      _id: 'geo1',
      name: 'locationA',
      label: 'Location A',
      type: 'geolocation',
      values: [{ value: { latitude: 10, longitude: 20 }, label: 'Location A', color: '#1A73E8' }],
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

    expect(formatGeolocationProperty(property, entityA, templates)).toEqual({
      _id: 'group1',
      name: 'group1',
      label: 'group1',
      type: 'geolocation',
      values: [
        { value: { latitude: 10, longitude: 20 }, label: 'Location A', color: '#1A73E8' },
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Location B',
          color: '#1A73E8',
        },
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

    expect(formatGeolocationProperty(property, entityB, templates)).toEqual({
      _id: 'group1',
      name: '__group1',
      label: '__group1',
      type: 'geolocation',
      values: [
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Location B',
          color: '#1A73E8',
        },
        {
          value: { latitude: 10, longitude: 20 },
          label: 'Location 1',
          color: '#FF6F00',
          entity: {
            _id: '1',
            icon: { _id: 'star', label: 'Star' },
          },
        },
        {
          value: { latitude: 11, longitude: 21 },
          label: 'Location 2',
          color: '#FF6F00',
          entity: {
            _id: '2',
          },
        },
      ],
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

    expect(formatGeolocationProperty(property, entityC, templates)).toEqual({
      _id: 'group2',
      name: '__group2',
      label: '__group2',
      type: 'geolocation',
      values: [
        {
          value: { latitude: -5, longitude: -6 },
          label: 'Location B',
          color: '#1A73E8',
        },
        {
          value: { latitude: 48.8566, longitude: 2.3522 },
          label: 'Location 3',
          color: '#FF6F00',
          entity: {
            _id: '3',
          },
        },
      ],
    });
  });
});
