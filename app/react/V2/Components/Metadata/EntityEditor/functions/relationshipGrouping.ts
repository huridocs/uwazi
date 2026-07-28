import type { MetadataValue } from '#V2/formatters/types.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';

type DisplayProperty = FormMetadataProperty & {
  groupedRelationshipNames?: string[];
};

type GroupedRelationshipSyncPair = {
  mainName: string;
  otherNames: string[];
};

const relationshipGroupKey = (property: { content?: string; relationType?: string }): string =>
  `${property.content ?? ''}::${property.relationType ?? ''}`;

const groupRelationshipProperties = (properties: FormMetadataProperty[]): DisplayProperty[] => {
  const groupedProperties = new Map<string, DisplayProperty>();

  properties.forEach(property => {
    if (property.type !== 'relationship') {
      groupedProperties.set(property._id, property);
      return;
    }

    const groupKey = relationshipGroupKey(property);
    const existing = groupedProperties.get(groupKey);

    if (!existing) {
      groupedProperties.set(groupKey, {
        ...property,
        groupedRelationshipNames: [property.name],
      });
      return;
    }

    groupedProperties.set(groupKey, {
      ...existing,
      label: `${existing.label} / ${property.label}`,
      required: Boolean(existing.required || property.required),
      groupedRelationshipNames: [
        ...(existing.groupedRelationshipNames ?? [existing.name]),
        property.name,
      ],
    });
  });

  return [...groupedProperties.values()];
};

const getGroupedRelationshipSyncPairs = (
  displayProperties: DisplayProperty[]
): GroupedRelationshipSyncPair[] =>
  displayProperties
    .filter(
      property =>
        property.type === 'relationship' &&
        Array.isArray(property.groupedRelationshipNames) &&
        property.groupedRelationshipNames.length > 1
    )
    .map(property => {
      const [mainName, ...otherNames] = property.groupedRelationshipNames ?? [];
      return { mainName, otherNames };
    });

const syncGroupedRelationshipMetadata = (
  metadata: Record<string, MetadataValue[]>,
  displayProperties: DisplayProperty[]
): Record<string, MetadataValue[]> => {
  const synced = { ...metadata };

  getGroupedRelationshipSyncPairs(displayProperties).forEach(({ mainName, otherNames }) => {
    const sourceValues = synced[mainName] ?? [];
    otherNames.forEach(name => {
      synced[name] = sourceValues;
    });
  });

  return synced;
};

export {
  relationshipGroupKey,
  groupRelationshipProperties,
  getGroupedRelationshipSyncPairs,
  syncGroupedRelationshipMetadata,
};
export type { DisplayProperty, GroupedRelationshipSyncPair };
