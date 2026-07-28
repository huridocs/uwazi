import type { MetadataValue } from '#V2/formatters/types.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import {
  getGroupedRelationshipSyncPairs,
  groupRelationshipProperties,
  relationshipGroupKey,
  syncGroupedRelationshipMetadata,
  type DisplayProperty,
} from '../relationshipGrouping.js';

describe('relationshipGroupKey', () => {
  it('should join content and relationType with a separator', () => {
    expect(relationshipGroupKey({ content: 'tpl', relationType: 'rel' })).toBe('tpl::rel');
    expect(relationshipGroupKey({})).toBe('::');
  });
});

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
      label: 'Owner / Residents',
      required: true,
      groupedRelationshipNames: ['related_people', 'related_residents'],
    });
    expect(grouped[2]).toMatchObject({
      name: 'other_rel',
      groupedRelationshipNames: ['other_rel'],
    });
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
