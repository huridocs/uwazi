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

  it('should keep non-relationship properties and merge matching relationships', () => {
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

  it('should share one source list for inherited properties of the same template', () => {
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

    expect(grouped).toHaveLength(1);
    expect(grouped[0].groupedRelationshipNames).toEqual(['relationshipmark', 'relationshipgeo']);
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

  it('should copy primary relationship values onto secondary names', () => {
    const source: MetadataValue[] = [{ value: 'shared-1', label: 'One' }];
    const metadata = {
      related_people: source,
      related_residents: [{ value: 'stale', label: 'Stale' }],
      simple_text: [{ value: 'keep' }],
    };

    expect(syncGroupedRelationshipMetadata(metadata, displayProperties)).toEqual({
      related_people: source,
      related_residents: source,
      simple_text: [{ value: 'keep' }],
    });
  });
});
