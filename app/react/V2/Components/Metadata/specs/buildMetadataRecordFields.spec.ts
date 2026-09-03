/** @jest-environment jsdom */
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { buildMetadataRecordFields } from '../buildMetadataRecordFields.js';

const inheritProp: ClientProperty = {
  _id: 'p-rel-geo',
  name: 'inheritedloc',
  type: 'relationship',
  label: 'Inherited location',
  content: 'related-tmpl',
  relationType: 'rel-type-1',
  inherit: { property: 'inherited-geo-prop', type: 'geolocation' },
};

const ownProp: ClientProperty = {
  _id: 'p-geo',
  name: 'ownloc',
  type: 'geolocation',
  label: 'Own location',
};

const groupedGeo: MetadataProperty = {
  _id: 'group1',
  name: '__group1',
  label: '__group1',
  type: 'geolocation',
  propertyGroup: [
    { _id: 'p-geo', name: 'ownloc', label: 'Own location' },
    {
      _id: 'p-rel-geo',
      name: 'inheritedloc',
      label: 'Inherited location',
      inherited: true,
      content: 'related-tmpl',
    },
  ],
  values: [
    { value: { latitude: 3, longitude: 4 }, label: 'Own' },
    { value: { latitude: 1, longitude: 2 }, label: 'A1' },
  ],
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 'tmpl-geo',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  metadata: {
    ownloc: [{ value: { lat: 3, lon: 4, label: 'Own' } }],
    inheritedloc: [
      {
        value: 'linked-a',
        label: 'A1',
        type: 'entity',
        inheritedType: 'geolocation',
        inheritedValue: [{ value: { lat: 1, lon: 2, label: '' } }],
      },
    ],
  },
};

describe('buildMetadataRecordFields', () => {
  it('keeps adjacent own and inherited geolocation on one grouped map field', () => {
    const templatePropertyById = new Map<string, ClientProperty>([
      ['p-geo', ownProp],
      ['p-rel-geo', inheritProp],
    ]);

    const { otherFields, relationshipFields } = buildMetadataRecordFields(
      [groupedGeo],
      templatePropertyById,
      entity
    );

    expect(otherFields).toHaveLength(1);
    expect(otherFields[0].type).toBe('geolocation');
    expect(otherFields[0].propertyGroup).toHaveLength(2);
    expect(otherFields[0].values).toHaveLength(2);
    expect(relationshipFields.some(field => field.name === 'inheritedloc')).toBe(false);
  });

  it('keeps a standalone inherited geolocation as a relationship field', () => {
    const standaloneInherit: MetadataProperty = {
      _id: 'p-rel-geo',
      name: 'inheritedloc',
      label: 'Inherited location',
      type: 'relationship',
      mode: 'inherited',
      inherited: true,
      inheritedType: 'geolocation',
      relationShipTarget: 'related-tmpl',
      values: [],
    };

    const { relationshipFields } = buildMetadataRecordFields(
      [standaloneInherit],
      new Map([['p-rel-geo', inheritProp]]),
      entity
    );

    expect(relationshipFields.some(field => field.name === 'inheritedloc')).toBe(true);
  });
});
