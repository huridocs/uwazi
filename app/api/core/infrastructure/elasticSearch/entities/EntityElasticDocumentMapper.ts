import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { MetadataObjectSchema, MetadataSchema } from '#shared/types/commonTypes.js';
import { PermissionSchema } from '#shared/types/permissionType.js';
import { Serialize } from '../../mongodb/common/Serialize.js';
import {
  EntityElasticDocument,
  DateRange,
  SelectValue,
  GeoPointValue,
  SlottedMetadata,
} from './EntityElasticDocument.js';
import type { SlotMap } from './MongoSlotsDAO.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};
const toNumberValue = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const assignNumericField = (target: DateRange, key: keyof DateRange, value: unknown): DateRange => {
  const parsed = toNumberValue(value);
  return parsed !== null ? { ...target, [key]: parsed } : target;
};

const assignNumericBoundary = (
  target: DateRange,
  source: Record<string, unknown>,
  key: keyof DateRange,
  fallbackKey?: string
): DateRange =>
  assignNumericField(target, key, source[key] ?? (fallbackKey ? source[fallbackKey] : undefined));

const toDateRangeValue = (value: unknown): DateRange | null => {
  if (!isRecord(value)) {
    return null;
  }

  let result: DateRange = {};
  result = assignNumericBoundary(result, value, 'gte', 'from');
  result = assignNumericBoundary(result, value, 'lte', 'to');

  return Object.keys(result).length > 0 ? result : null;
};

const toSelectValue = (entry: MetadataObjectSchema): SelectValue => {
  const parent =
    entry.parent && typeof entry.parent === 'object'
      ? {
          label: toStringValue(entry.parent.label),
          value: toStringValue(entry.parent.value),
        }
      : undefined;
  return {
    label: toStringValue(entry.label ?? entry.value),
    value: toStringValue(entry.value),
    ...(parent ? { parent } : {}),
  };
};

const toGeoPointValue = (value: unknown): GeoPointValue | null => {
  if (!isRecord(value)) {
    return null;
  }
  const lat = toNumberValue(value.lat);
  const lon = toNumberValue(value.lon);
  if (lat === null || lon === null) {
    return null;
  }
  return { lat, lon };
};

const toLinkValue = (value: unknown): string => {
  if (isRecord(value)) {
    const { url } = value;
    if (url !== null && url !== undefined) {
      return toStringValue(url);
    }
    const { label } = value;
    if (label !== null && label !== undefined) {
      return toStringValue(label);
    }
  }
  return toStringValue(value);
};
const relationshipSlotFamilies = [
  'relationship_txt_',
  'relationship_num_',
  'relationship_date_',
  'relationship_range_',
  'relationship_select_',
  'relationship_geolocation_',
] as const;

type RelationshipSlotFamily = (typeof relationshipSlotFamilies)[number] | 'relationship_';
type InheritedValues = NonNullable<MetadataObjectSchema['inheritedValue']>;

const getRelationshipSlotFamily = (slotName: string): RelationshipSlotFamily =>
  relationshipSlotFamilies.find(family => slotName.startsWith(family)) || 'relationship_';

const toInheritedRelationshipText = (values: InheritedValues) =>
  values.map(inherited => toLinkValue(inherited.value));

const toInheritedRelationshipNumbers = (values: InheritedValues) =>
  values
    .map(inherited => toNumberValue(inherited.value))
    .filter((value): value is number => value !== null);

const toInheritedRelationshipRanges = (values: InheritedValues) =>
  values
    .map(inherited => toDateRangeValue(inherited.value))
    .filter((value): value is DateRange => value !== null);

const toInheritedRelationshipSelect = (values: InheritedValues) =>
  values.map(inherited =>
    toSelectValue({
      value: inherited.value,
      label: inherited.label,
      parent: inherited.parent,
    } as MetadataObjectSchema)
  );

const toInheritedRelationshipGeo = (values: InheritedValues) =>
  values
    .map(inherited => toGeoPointValue(inherited.value))
    .filter((value): value is GeoPointValue => value !== null);

const relationshipInheritedValueMappers: Partial<
  Record<RelationshipSlotFamily, (values: InheritedValues) => unknown>
> = {
  relationship_txt_: toInheritedRelationshipText,
  relationship_num_: toInheritedRelationshipNumbers,
  relationship_date_: toInheritedRelationshipNumbers,
  relationship_range_: toInheritedRelationshipRanges,
  relationship_select_: toInheritedRelationshipSelect,
  relationship_geolocation_: toInheritedRelationshipGeo,
};

const toInheritedRelationshipValue = (slotName: string, inheritedValues: InheritedValues) => {
  const mapper = relationshipInheritedValueMappers[getRelationshipSlotFamily(slotName)];
  return mapper?.(inheritedValues);
};

const toRelationshipBySlot = (
  slotName: string,
  entry: MetadataObjectSchema
): Record<string, unknown> => {
  const baseValue = {
    label: toStringValue(entry.label),
    value: toStringValue(entry.value),
  };

  const inheritedValues = Array.isArray(entry.inheritedValue) ? entry.inheritedValue : [];
  const inheritedValue = toInheritedRelationshipValue(slotName, inheritedValues);
  return inheritedValue === undefined ? baseValue : { ...baseValue, inheritedValue };
};

class EntityElasticDocumentMapper {
  static toDocuments(entities: EntityDBO[], slotMap: SlotMap): EntityElasticDocument[] {
    return entities.map(entity => this.toDocument(entity, slotMap));
  }

  private static toDocument(entity: EntityDBO, slotMap: SlotMap): EntityElasticDocument {
    return {
      sharedId: entity.sharedId,
      language: entity.language,
      template: entity.template?.toString(),
      title: entity.title,
      rawEntity: entity as unknown as Serialize<EntityDBO>,
      metadata: this.buildSlottedMetadata((entity.metadata as MetadataSchema) || {}, slotMap),
      published: entity.published,
      permissionRefIds: this.buildPermissionRefIds(entity.permissions || []),
      user: entity.user?.toString(),
      creationDate: entity.creationDate,
      editDate: entity.editDate,
      fullText: { name: 'entity' },
    } as EntityElasticDocument;
  }

  private static buildSlottedMetadata(metadata: MetadataSchema, slotMap: SlotMap): SlottedMetadata {
    const slottedMetadata: Record<string, unknown> = {};

    Object.entries(metadata).forEach(([propertyName, entries]) => {
      const slot = slotMap.get(propertyName);

      if (!entries || !slot) {
        return;
      }

      const { slotName, type } = slot;

      switch (type) {
        case 'text':
        case 'markdown':
        case 'generatedid':
          slottedMetadata[slotName] = entries.map(entry => toStringValue(entry.value));
          break;
        case 'link':
          slottedMetadata[slotName] = entries.map(entry => toLinkValue(entry.value));
          break;
        case 'date':
        case 'multidate':
        case 'numeric':
          slottedMetadata[slotName] = entries
            .map(entry => toNumberValue(entry.value))
            .filter((value): value is number => value !== null);
          break;
        case 'daterange':
        case 'multidaterange':
          slottedMetadata[slotName] = entries
            .map(entry => toDateRangeValue(entry.value))
            .filter((value): value is DateRange => value !== null);
          break;
        case 'select':
        case 'multiselect':
          slottedMetadata[slotName] = entries.map(toSelectValue);
          break;
        case 'relationship':
          slottedMetadata[slotName] = entries.map(entry => toRelationshipBySlot(slotName, entry));
          break;
        case 'geolocation':
          slottedMetadata[slotName] = entries
            .map(entry => toGeoPointValue(entry.value))
            .filter((value): value is GeoPointValue => value !== null);
          break;
        default:
          break;
      }
    });

    return slottedMetadata as SlottedMetadata;
  }

  private static buildPermissionRefIds(permissions: PermissionSchema[]): string[] {
    return permissions.map(permission => permission.refId.toString());
  }
}

export { EntityElasticDocumentMapper };
