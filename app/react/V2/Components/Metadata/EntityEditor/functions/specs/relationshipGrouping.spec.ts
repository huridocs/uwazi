import type { MetadataValue } from '#V2/formatters/types.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import {
  getGroupedRelationshipSyncPairs,
  groupRelationshipProperties,
  syncGroupedRelationshipMetadata,
  type DisplayProperty,
} from '../relationshipGrouping.js';

describe('groupRelationshipProperties', () => {
  const properties: FormMetadataProperty[] = [
    { _id: '1', type: 'text', name: 'title_text', label: 'Text' },
    {
      _id: '2',
      type: 'relationship',
      name: 'related_people',
      label: 'Owner',
      content: 'template2',
      relationType: 'rel1',
      required: true,
    },
    {
      _id: '3',
      type: 'relationship',
      name: 'related_residents',
      label: 'Residents',
      content: 'template2',
      relationType: 'rel1',
    },
    {
      _id: '4',
      type: 'relationship',
      name: 'other_rel',
      label: 'Other',
      content: 'template3',
      relationType: 'rel2',
    },
  ];

  it('should group relationship properties that share a template and relation type', () => {
    const grouped = groupRelationshipProperties(properties);

    expect(grouped).toHaveLength(3);
    expect(grouped[0]).toMatchObject({ name: 'title_text', type: 'text' });
    expect(grouped[1]).toMatchObject({
      name: 'related_people',
      label: 'Owner',
      required: true,
      groupedRelationshipNames: ['related_people', 'related_residents'],
    });
    expect(grouped[2]).toMatchObject({
      name: 'other_rel',
      groupedRelationshipNames: ['other_rel'],
    });
  });

  it('should group inherited properties by relation type', () => {
    const grouped = groupRelationshipProperties([
      {
        _id: 'md',
        type: 'relationship',
        name: 'relationshipmark',
        label: 'RelationshipMark',
        content: 'use-test',
        relationType: 'rel-md',
        inherited: true,
        inherit: { property: 'md', type: 'markdown' },
      },
      {
        _id: 'geo',
        type: 'relationship',
        name: 'relationshipgeo',
        label: 'RelationshipGeo',
        content: 'use-test',
        relationType: 'rel-geo',
        inherited: true,
        inherit: { property: 'geo', type: 'geolocation' },
      },
    ]);

    expect(grouped.map(property => property.name)).toEqual(['relationshipmark', 'relationshipgeo']);
    expect(grouped[0].groupedRelationshipNames).toEqual(['relationshipmark']);
    expect(grouped[1].groupedRelationshipNames).toEqual(['relationshipgeo']);
  });

  it('shows one selector when a direct relationship and an inherited relationship share a target template and relation type', () => {
    const grouped = groupRelationshipProperties([
      {
        _id: 'b',
        type: 'relationship',
        name: 'direct_b',
        label: 'B',
        content: 'T1',
        relationType: 'R',
      },
      {
        _id: 'c',
        type: 'relationship',
        name: 'inherited_c',
        label: 'C',
        content: 'T1',
        relationType: 'R',
        inherited: true,
        inherit: { property: 'E', type: 'text' },
      },
      {
        _id: 'other',
        type: 'relationship',
        name: 'other_type',
        label: 'Other',
        content: 'T1',
        relationType: 'other',
      },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]).toMatchObject({
      name: 'direct_b',
      groupedRelationshipNames: ['direct_b', 'inherited_c'],
    });
    expect(grouped[1]).toMatchObject({
      name: 'other_type',
      groupedRelationshipNames: ['other_type'],
    });
  });

  it('keeps relationship properties that lack a target template or relation type as separate selectors', () => {
    const grouped = groupRelationshipProperties([
      {
        _id: 'no-content-a',
        type: 'relationship',
        name: 'no_content_a',
        label: 'No content A',
        relationType: 'R',
      },
      {
        _id: 'no-content-b',
        type: 'relationship',
        name: 'no_content_b',
        label: 'No content B',
        relationType: 'R',
      },
      {
        _id: 'no-type-a',
        type: 'relationship',
        name: 'no_type_a',
        label: 'No type A',
        content: 'T1',
      },
      {
        _id: 'no-type-b',
        type: 'relationship',
        name: 'no_type_b',
        label: 'No type B',
        content: 'T1',
      },
    ]);

    expect(grouped.map(property => property.name)).toEqual([
      'no_content_a',
      'no_content_b',
      'no_type_a',
      'no_type_b',
    ]);
  });
});

describe('syncGroupedRelationshipMetadata', () => {
  const displayProperties: DisplayProperty[] = [
    {
      _id: '1',
      type: 'relationship',
      name: 'related_people',
      label: 'Owner / Residents',
      content: 'template2',
      relationType: 'rel1',
      groupedRelationshipNames: ['related_people', 'related_residents'],
    },
    {
      _id: '2',
      type: 'text',
      name: 'simple_text',
      label: 'Text',
    },
  ];

  it('should list sync pairs only for multi-name relationship groups', () => {
    expect(getGroupedRelationshipSyncPairs(displayProperties)).toEqual([
      { mainName: 'related_people', otherNames: ['related_residents'] },
    ]);
  });

  it('keeps every entity stored on the grouped properties', () => {
    const source: MetadataValue[] = [{ value: 'shared-1', label: 'One' }];
    const metadata = {
      related_people: source,
      related_residents: [{ value: 'stale', label: 'Stale' }],
      simple_text: [{ value: 'keep' }],
    };

    expect(syncGroupedRelationshipMetadata(metadata, displayProperties)).toEqual({
      related_people: [...source, { value: 'stale', label: 'Stale' }],
      related_residents: [...source, { value: 'stale', label: 'Stale' }],
      simple_text: [{ value: 'keep' }],
    });
  });

  it('should keep each property inherited value when the shared entities are aligned', () => {
    const metadata: Record<string, MetadataValue[]> = {
      related_people: [
        {
          value: 'shared-1',
          label: 'One',
          inheritedType: 'geolocation',
          inheritedValue: [{ value: { lat: 1, lon: 2 } }],
        },
        {
          value: 'shared-2',
          label: 'Two',
          inheritedType: 'geolocation',
          inheritedValue: [{ value: { lat: 3, lon: 4 } }],
        },
      ],
      related_residents: [
        {
          value: 'shared-1',
          label: 'Old',
          inheritedType: 'image',
          inheritedValue: [{ value: '/api/files/photo.png' }],
        },
      ],
      simple_text: [{ value: 'keep' }],
    };

    expect(syncGroupedRelationshipMetadata(metadata, displayProperties)).toEqual({
      related_people: metadata.related_people,
      related_residents: [
        {
          value: 'shared-1',
          label: 'One',
          inheritedType: 'image',
          inheritedValue: [{ value: '/api/files/photo.png' }],
        },
        { value: 'shared-2', label: 'Two' },
      ],
      simple_text: [{ value: 'keep' }],
    });
  });
});
