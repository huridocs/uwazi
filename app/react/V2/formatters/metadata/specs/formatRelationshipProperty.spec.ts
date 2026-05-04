import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatRelationshipProperty } from '../formatRelationshipProperty.js';

describe('formatRelationshipProperty', () => {
  const metadata = {
    related_people: [
      {
        value: 'entity2',
        label: 'Maria Rodriguez - Witness',
        icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
        inheritedValue: [
          { value: 'thes1.2', label: 'Again' },
          { value: 'thes1.1', label: 'Acknowledging' },
        ],
        inheritedType: 'multiselect',
      },
      {
        value: 'entity3',
        label: 'John Smith - Reporter',
        icon: '',
        inheritedValue: [],
        inheritedType: 'multiselect',
      },
    ],
    nearby_incidents: [
      {
        value: 'entity4',
        label: 'Traffic Accident - Main Street',
        icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
      },
      {
        value: 'entity5',
        label: 'Fire Incident - Downtown',
        icon: '',
      },
    ],
    hierarchical_relationships: [
      {
        value: '6qdshinfobf',
        label: 'Emergency Response Team',
        icon: '',
        inheritedValue: [
          {
            value: 'entity7',
            label: 'First Responders',
            icon: '',
            inheritedValue: [
              {
                value: 'entity8',
                label: 'Police Officer - Maria Rodriguez',
                icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
                inheritedValue: [
                  { value: 'thes1.2', label: 'Again' },
                  { value: 'thes1.1', label: 'Acknowledging' },
                ],
                inheritedType: 'multiselect',
              },
            ],
            inheritedType: 'relationship',
          },
        ],
        inheritedType: 'relationship',
      },
    ],
  } as Entity['metadata'];

  it('should return null for non-relationship properties', () => {
    const property = {
      _id: 'text1',
      name: 'simple_text',
      label: 'Simple Text',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toBeNull();
  });

  it('should resolve inherited relationships', () => {
    const property = {
      _id: '1.10',
      name: 'related_people',
      label: 'Related people',
      type: 'relationship',
      inherited: true,
      inheritedType: 'multiselect',
      relationShipTarget: 'template-people',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toEqual({
      _id: '1.10',
      name: 'related_people',
      label: 'Related people',
      type: 'multiselect',
      values: [
        {
          value: 'thes1.2',
          label: 'Again',
        },
        {
          value: 'thes1.1',
          label: 'Acknowledging',
        },
      ],
    });
  });

  it('should resolve nested relationship inheritance chains to terminal inherited values', () => {
    const property = {
      _id: '1.20',
      name: 'hierarchical_relationships',
      label: 'Hierarchical relationships',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
      relationShipTarget: 'template-people',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toEqual({
      _id: '1.20',
      name: 'hierarchical_relationships',
      label: 'Hierarchical relationships',
      type: 'multiselect',
      values: [
        {
          value: 'thes1.2',
          label: 'Again',
        },
        {
          value: 'thes1.1',
          label: 'Acknowledging',
        },
      ],
    });
  });

  it('should format regular relationship entities', () => {
    const property = {
      _id: '1.11',
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      type: 'relationship',
      inherited: false,
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toEqual({
      _id: '1.11',
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      mode: 'related',
      type: 'relationship',
      values: [
        {
          _id: 'entity4',
          title: 'Traffic Accident - Main Street',
          icon: { _id: 'ECU', label: 'Ecuador' },
        },
        {
          _id: 'entity5',
          title: 'Fire Incident - Downtown',
        },
      ],
      inherited: false,
      inheritedType: undefined,
    });
  });

  it('should return empty values when metadata array is empty', () => {
    const property = {
      _id: '1.12',
      name: 'empty_relationships',
      label: 'Empty Relationships',
      type: 'relationship',
    } as BaseMetadataProperty;

    expect(
      formatRelationshipProperty(property, { empty_relationships: [] } as Entity['metadata'])
    ).toEqual({
      _id: '1.12',
      name: 'empty_relationships',
      label: 'Empty Relationships',
      type: 'relationship',
      mode: 'related',
      values: [],
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return empty values when metadata is undefined', () => {
    const property = {
      _id: '1.13',
      name: 'missing_relationships',
      label: 'Missing Relationships',
      type: 'relationship',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, undefined)).toEqual({
      _id: '1.13',
      name: 'missing_relationships',
      label: 'Missing Relationships',
      type: 'relationship',
      mode: 'related',
      values: [],
      inherited: undefined,
      inheritedType: undefined,
    });
  });
});
