import type { MetadataValue } from '#V2/formatters/types.js';
import { relationshipMemberKey } from '../../relationshipInherit.js';
import { metadataFormKey, type FormMetadataProperty } from './formatMetadataForForm.js';

type DisplayProperty = FormMetadataProperty & {
  groupedRelationshipNames?: string[];
};

type GroupedRelationshipSyncPair = {
  mainName: string;
  otherNames: string[];
};

const groupRelationshipProperties = (properties: FormMetadataProperty[]): DisplayProperty[] => {
  const groupedProperties = new Map<string, DisplayProperty>();

  properties.forEach(property => {
    if (property.type !== 'relationship') {
      groupedProperties.set(property._id, property);
      return;
    }

    const groupKey = relationshipMemberKey(property, property._id);
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

const connectionValue = (value: MetadataValue): MetadataValue => {
  const connection = { ...value };
  delete connection.inheritedType;
  delete connection.inheritedValue;
  return connection;
};

const withInherited = (base: MetadataValue, extra: MetadataValue): MetadataValue => {
  const merged = { ...base };
  if (merged.inheritedType === undefined && extra.inheritedType !== undefined) {
    merged.inheritedType = extra.inheritedType;
  }
  if (merged.inheritedValue === undefined && extra.inheritedValue !== undefined) {
    merged.inheritedValue = extra.inheritedValue;
  }
  return merged;
};

const unionRelationshipValues = (lists: MetadataValue[][]): MetadataValue[] => {
  const byEntity = new Map<string, MetadataValue>();
  lists.flat().forEach(value => {
    const id = String(value.value ?? '');
    const current = byEntity.get(id);
    if (!current) {
      byEntity.set(id, value);
      return;
    }
    const kept = withInherited(connectionValue(current), current);
    byEntity.set(id, withInherited(kept, value));
  });
  return [...byEntity.values()];
};

const alignGroupedRelationshipValues = (
  sourceValues: MetadataValue[],
  currentValues: MetadataValue[]
): MetadataValue[] => {
  const currentByEntity = new Map(currentValues.map(value => [String(value.value ?? ''), value]));
  return sourceValues.map(source => {
    const current = currentByEntity.get(String(source.value ?? ''));
    const connection = connectionValue(source);
    return current ? withInherited(connection, current) : connection;
  });
};

const syncGroupedRelationshipMetadata = (
  metadata: Record<string, MetadataValue[]>,
  displayProperties: DisplayProperty[]
): Record<string, MetadataValue[]> => {
  const synced = { ...metadata };

  getGroupedRelationshipSyncPairs(displayProperties).forEach(({ mainName, otherNames }) => {
    const names = [mainName, ...otherNames];
    const lists = names.map(name => synced[metadataFormKey(name)] ?? []);
    const union = unionRelationshipValues(lists);
    names.forEach((name, index) => {
      synced[metadataFormKey(name)] = alignGroupedRelationshipValues(union, lists[index]);
    });
  });

  return synced;
};

export {
  groupRelationshipProperties,
  getGroupedRelationshipSyncPairs,
  alignGroupedRelationshipValues,
  syncGroupedRelationshipMetadata,
};
export type { DisplayProperty, GroupedRelationshipSyncPair };
