/* eslint-disable no-continue */
/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import {
  MetadataObjectSchema,
  MetadataSchema,
  LanguageISO6391,
} from '#shared/types/commonTypes.js';
import { PermissionSchema } from '#shared/types/permissionType.js';
import { Serialize } from '../../mongodb/common/Serialize.js';
import {
  EntityElasticDocument,
  DateRange,
  SelectValue,
  GeoPointValue,
  SlottedMetadata,
} from './EntityElasticDocument.js';
import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import type { SlotMap } from './MongoSlotsDAO.js';
import { SlotTypeRegistry } from './SlotTypeRegistry.js';

type MappedDocument = { sharedId: string; document: EntityElasticDocument };
type RelationshipSlotFamily = (typeof relationshipSlotFamilies)[number] | 'relationship_';
type InheritedValues = NonNullable<MetadataObjectSchema['inheritedValue']>;

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

const toDateRangeValue = (value: unknown): DateRange | null => {
  if (!isRecord(value)) {
    return null;
  }

  const result: DateRange = {};
  if (value.from) {
    result.gte = value.from as number;
  }

  if (value.to) {
    result.lte = value.to as number;
  }

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
  static toDocuments(entities: EntityDBO[], slotMap: SlotMap): MappedDocument[] {
    const groups = new Map<string, EntityDBO[]>();
    for (const entity of entities) {
      const group = groups.get(entity.sharedId) ?? [];
      group.push(entity);
      groups.set(entity.sharedId, group);
    }

    return [...groups.entries()].map(([sharedId, variants]) => ({
      sharedId,
      document: this.buildDocument(sharedId, variants, slotMap),
    }));
  }

  private static buildDocument(
    sharedId: string,
    variants: EntityDBO[],
    slotMap: SlotMap
  ): EntityElasticDocument {
    const first = variants[0];

    const rawEntities: Partial<Record<LanguageISO6391, Serialize<EntityDBO>>> = {};
    for (const variant of variants) {
      rawEntities[variant.language as LanguageISO6391] = variant as unknown as Serialize<EntityDBO>;
    }

    const slottedMetadata: Record<string, unknown> = {};

    for (const variant of variants) {
      const lang = variant.language as LanguageISO6391;

      // Title (always translatable txt)
      const titleSlotKey = MongoSlotsDAO.slotKey('title', lang);
      const titleSlot = slotMap.get(titleSlotKey);
      if (titleSlot) {
        slottedMetadata[titleSlot.slotName] = [variant.title ?? ''];
      }

      const metadata = (variant.metadata as MetadataSchema) || {};

      for (const [propertyName, entries] of Object.entries(metadata)) {
        if (!entries) continue;

        // Attempt translatable lookup first
        const translatableKey = MongoSlotsDAO.slotKey(propertyName, lang);
        const translatableSlot = slotMap.get(translatableKey);
        if (translatableSlot) {
          slottedMetadata[translatableSlot.slotName] = this.buildSlotValue(
            translatableSlot.slotName,
            translatableSlot.type,
            entries
          );
          continue;
        }

        // Non-translatable: only process from first variant
        if (variant !== first) continue;

        const nonTranslatableSlot = slotMap.get(propertyName);
        if (nonTranslatableSlot && !SlotTypeRegistry.isTranslatable(nonTranslatableSlot.type)) {
          slottedMetadata[nonTranslatableSlot.slotName] = this.buildSlotValue(
            nonTranslatableSlot.slotName,
            nonTranslatableSlot.type,
            entries
          );
        }
      }
    }

    return {
      sharedId,
      template: first.template.toString(),
      rawEntities,
      metadata: slottedMetadata as SlottedMetadata,
      published: first.published,
      permissionRefIds: this.buildPermissionRefIds(first.permissions || []),
      user: first.user?.toString(),
      creationDate: first.creationDate,
      editDate: first.editDate,
      fullText: { name: 'entity' },
    } as EntityElasticDocument;
  }

  private static buildSlotValue(
    slotName: string,
    type: string,
    entries: MetadataObjectSchema[]
  ): unknown {
    switch (type) {
      case 'txt':
        return entries.map(entry => toLinkValue(entry.value));
      case 'date':
      case 'num':
        return entries
          .map(entry => toNumberValue(entry.value))
          .filter((value): value is number => value !== null);
      case 'range':
        return entries
          .map(entry => toDateRangeValue(entry.value))
          .filter((value): value is DateRange => value !== null);
      case 'select':
        return entries.map(toSelectValue);
      case 'relationship':
      case 'relationship_txt':
      case 'relationship_num':
      case 'relationship_date':
      case 'relationship_range':
      case 'relationship_select':
      case 'relationship_geolocation':
        return entries.map(entry => toRelationshipBySlot(slotName, entry));
      case 'geolocation':
        return entries
          .map(entry => toGeoPointValue(entry.value))
          .filter((value): value is GeoPointValue => value !== null);
      default:
        return undefined;
    }
  }

  private static buildPermissionRefIds(permissions: PermissionSchema[]): string[] {
    return permissions.map(permission => permission.refId.toString());
  }
}

export { EntityElasticDocumentMapper };
export type { MappedDocument };
