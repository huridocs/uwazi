import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatRelationshipProperty } from '../formatRelationshipProperty.js';

const ids = {
  entity: {
    sensitiveCase: '64b1636e2e6f8a001f9a0101',
    witnessMaria: '64b1636e2e6f8a001f9a0102',
    reporterJohn: '64b1636e2e6f8a001f9a0103',
    incidentMainStreet: '64b1636e2e6f8a001f9a0104',
    incidentDowntown: '64b1636e2e6f8a001f9a0105',
    responseTeam: '64b1636e2e6f8a001f9a0106',
    firstResponders: '64b1636e2e6f8a001f9a0107',
    officerMaria: '64b1636e2e6f8a001f9a0108',
  },
  thesaurus: {
    again: '64b1636e2e6f8a001f9aa0101',
    acknowledging: '64b1636e2e6f8a001f9aa0102',
  },
  property: {
    simpleText: '64b1636e2e6f8a001f9ab0001',
    relatedPeople: '64b1636e2e6f8a001f9ab0002',
    hierarchicalRelationships: '64b1636e2e6f8a001f9ab0003',
    nearbyIncidentsNewRel: '64b1636e2e6f8a001f9ab0004',
    nearbyIncidentsRel: '64b1636e2e6f8a001f9ab0005',
    restrictedLinks: '64b1636e2e6f8a001f9ab0006',
    emptyRelationships: '64b1636e2e6f8a001f9ab0007',
    missingRelationships: '64b1636e2e6f8a001f9ab0008',
  },
  template: {
    people: '64b1636e2e6f8a001f9ac0001',
    incidents: '64b1636e2e6f8a001f9ac0002',
  },
} as const;

describe('formatRelationshipProperty', () => {
  const metadata = {
    related_people: [
      {
        value: ids.entity.witnessMaria,
        label: 'Maria Rodriguez - Witness',
        icon: { _id: 'ECU', label: 'Ecuador', type: 'icon' },
        inheritedValue: [
          { value: ids.thesaurus.again, label: 'Again' },
          { value: ids.thesaurus.acknowledging, label: 'Acknowledging' },
        ],
        inheritedType: 'multiselect',
      },
      {
        value: ids.entity.reporterJohn,
        label: 'John Smith - Reporter',
        inheritedValue: [],
        inheritedType: 'multiselect',
      },
    ],
    nearby_incidents: [
      {
        value: ids.entity.incidentMainStreet,
        label: 'Traffic Accident - Main Street',
        icon: { _id: 'ECU', label: 'Ecuador', type: 'icon' },
      },
      {
        value: ids.entity.incidentDowntown,
        label: 'Fire Incident - Downtown',
      },
    ],
    hierarchical_relationships: [
      {
        value: ids.entity.responseTeam,
        label: 'Emergency Response Team',
        inheritedValue: [
          {
            value: ids.entity.firstResponders,
            label: 'First Responders',
            inheritedValue: [
              {
                value: ids.entity.officerMaria,
                label: 'Police Officer - Maria Rodriguez',
                icon: { _id: 'ECU', label: 'Ecuador', type: 'icon' },
                inheritedValue: [
                  { value: ids.thesaurus.again, label: 'Again' },
                  { value: ids.thesaurus.acknowledging, label: 'Acknowledging' },
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
      _id: ids.property.simpleText,
      name: 'simple_text',
      label: 'Simple Text',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toBeNull();
  });

  it('should return null when inheritance resolves to non-relationship types', () => {
    const property = {
      _id: ids.property.relatedPeople,
      name: 'related_people',
      label: 'Related people',
      type: 'relationship',
      inherited: true,
      inheritedType: 'multiselect',
      relationShipTarget: ids.template.people,
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toBeNull();
  });

  it('should return null for deeply nested inheritance ending in non-relationship types', () => {
    const property = {
      _id: ids.property.hierarchicalRelationships,
      name: 'hierarchical_relationships',
      label: 'Hierarchical relationships',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
      relationShipTarget: ids.template.incidents,
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toBeNull();
  });

  it('should format newRelationship properties like relationship (legacy newRelationship → relationship)', () => {
    const property = {
      _id: ids.property.nearbyIncidentsNewRel,
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      type: 'newRelationship',
      inherited: false,
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toEqual({
      _id: ids.property.nearbyIncidentsNewRel,
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      mode: 'related',
      type: 'relationship',
      values: [
        {
          _id: ids.entity.incidentMainStreet,
          title: 'Traffic Accident - Main Street',
          icon: { _id: 'ECU', label: 'Ecuador' },
        },
        {
          _id: ids.entity.incidentDowntown,
          title: 'Fire Incident - Downtown',
        },
      ],
      inherited: false,
      inheritedType: undefined,
    });
  });

  it('should format regular relationship entities', () => {
    const property = {
      _id: ids.property.nearbyIncidentsRel,
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      type: 'relationship',
      inherited: false,
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, metadata)).toEqual({
      _id: ids.property.nearbyIncidentsRel,
      name: 'nearby_incidents',
      label: 'Nearby incidents',
      mode: 'related',
      type: 'relationship',
      values: [
        {
          _id: ids.entity.incidentMainStreet,
          title: 'Traffic Accident - Main Street',
          icon: { _id: 'ECU', label: 'Ecuador' },
        },
        {
          _id: ids.entity.incidentDowntown,
          title: 'Fire Incident - Downtown',
        },
      ],
      inherited: false,
      inheritedType: undefined,
    });
  });

  it('should pass through authorized false when present on stored metadata (search / permissions row)', () => {
    const restricted = {
      restricted_links: [
        {
          value: ids.entity.sensitiveCase,
          label: 'Sensitive case',
          authorized: false as const,
        },
      ],
    } as Entity['metadata'];

    const property = {
      _id: ids.property.restrictedLinks,
      name: 'restricted_links',
      label: 'Restricted',
      type: 'relationship',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, restricted)).toEqual({
      _id: ids.property.restrictedLinks,
      name: 'restricted_links',
      label: 'Restricted',
      mode: 'related',
      type: 'relationship',
      values: [
        {
          _id: ids.entity.sensitiveCase,
          title: 'Sensitive case',
          authorized: false,
        },
      ],
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return empty values when metadata array is empty', () => {
    const property = {
      _id: ids.property.emptyRelationships,
      name: 'empty_relationships',
      label: 'Empty Relationships',
      type: 'relationship',
    } as BaseMetadataProperty;

    expect(
      formatRelationshipProperty(property, { empty_relationships: [] } as Entity['metadata'])
    ).toEqual({
      _id: ids.property.emptyRelationships,
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
      _id: ids.property.missingRelationships,
      name: 'missing_relationships',
      label: 'Missing Relationships',
      type: 'relationship',
    } as BaseMetadataProperty;

    expect(formatRelationshipProperty(property, undefined)).toEqual({
      _id: ids.property.missingRelationships,
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
