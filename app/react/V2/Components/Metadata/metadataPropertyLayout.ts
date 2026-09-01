import type { ClientProperty } from '#V2/shared/types.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { sortByTemplatePropertyOrder } from './sortByTemplatePropertyOrder.js';
import { relationshipGroupKey } from './relationshipInherit.js';

type MetadataTemplateField = { fullWidth?: boolean; showInCard?: boolean } | undefined;

const LONG_FIELD_CHAR_THRESHOLD = 100;
const LONG_TEXT_CHAR_THRESHOLD = 160;

const SPECIALIZED_FULL_WIDTH_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'geolocation',
  'image',
  'preview',
  'media',
  'markdown',
];

const TEMPLATE_FULL_WIDTH_GRID_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'image',
  'preview',
  'media',
];

const COMPACT_METADATA_FIELD_LAYOUT = 'min-w-0 flex-1';
const FULL_ROW_METADATA_FIELD_LAYOUT = 'min-w-0 w-full basis-full shrink-0';
const COMPACT_CARD_MIN_PX = 160;
const MEDIA_CARD_MIN_PX = 288;
const PROPERTY_ROW_GAP_PX = 12;
const MEDIA_MAX_PER_ROW = 3;
const MEDIA_PACK_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'image',
  'preview',
  'media',
  'geolocation',
];
type MasonryPackClass = 'short' | 'media' | 'block';
type PropertyRow = { fields: MetadataProperty[] };
const joinedScalarText = (data: MetadataProperty): string => {
  if (data.type !== 'text' && data.type !== 'generatedid' && data.type !== 'numeric') {
    return '';
  }
  return data.values.map(v => String(v.value ?? '')).join('\n');
};

const isSpecializedFullWidthField = (data: MetadataProperty): boolean =>
  SPECIALIZED_FULL_WIDTH_TYPES.includes(data.type);

const isLongField = (data: MetadataProperty): boolean => {
  if (isSpecializedFullWidthField(data)) {
    return false;
  }
  if (data.type !== 'text' && data.type !== 'generatedid' && data.type !== 'numeric') {
    return false;
  }
  const text = joinedScalarText(data);
  return text.length > LONG_FIELD_CHAR_THRESHOLD || text.includes('\n');
};

const isRelationshipProperty = (data: MetadataProperty): data is RelationshipMetadataProperty =>
  data.type === 'relationship';

const isLinkOnlyRelationship = (field: RelationshipMetadataProperty): boolean => !field.inherited;

const isInheritingRelationship = (
  field: MetadataProperty
): field is RelationshipMetadataProperty & { inherited: true } =>
  isRelationshipProperty(field) && Boolean(field.inherited);

const inheritGroupKey = (
  field: RelationshipMetadataProperty,
  byId: Map<string, ClientProperty>
): string => {
  const property = byId.get(field._id);
  return relationshipGroupKey({ content: property?.content, relationType: property?.relationType });
};

const isLongTextProperty = (data: MetadataProperty): boolean => {
  if (data.type !== 'text') {
    return false;
  }
  const text = data.values.map(v => String(v.value ?? '')).join('\n');
  return text.length >= LONG_TEXT_CHAR_THRESHOLD || text.includes('\n');
};

const usesTemplateFullWidthGrid = (
  data: MetadataProperty,
  templateField: MetadataTemplateField
): boolean =>
  Boolean(templateField?.fullWidth) && TEMPLATE_FULL_WIDTH_GRID_TYPES.includes(data.type);

const isMediaPackType = (type: MetadataProperty['type']): boolean =>
  MEDIA_PACK_TYPES.includes(type);

const contentLength = (data: MetadataProperty): number => {
  if (
    data.type === 'text' ||
    data.type === 'generatedid' ||
    data.type === 'numeric' ||
    data.type === 'markdown'
  ) {
    return data.values.map(value => value.value).join('\n').length;
  }
  if (data.type === 'select' || data.type === 'multiselect' || data.type === 'link') {
    return data.values.map(value => value.label || value.value || '').join('\n').length;
  }
  if (data.type === 'relationship' && data.mode === 'related') {
    return data.values.map(value => value.title).join('\n').length;
  }
  return 0;
};

const packClassForProperty = (
  data: MetadataProperty,
  templateField: MetadataTemplateField
): MasonryPackClass => {
  if (isInheritingRelationship(data) || data.type === 'markdown' || isLongTextProperty(data)) {
    return 'block';
  }
  if (isMediaPackType(data.type)) {
    return 'media';
  }
  if (usesTemplateFullWidthGrid(data, templateField)) {
    return 'block';
  }
  if (isLongField(data) || contentLength(data) > LONG_FIELD_CHAR_THRESHOLD) {
    return 'block';
  }
  return 'short';
};

const metadataGridClassForProperty = (
  data: MetadataProperty,
  templateField: MetadataTemplateField
): string => {
  const packClass = packClassForProperty(data, templateField);
  if (packClass === 'block') {
    return FULL_ROW_METADATA_FIELD_LAYOUT;
  }
  return COMPACT_METADATA_FIELD_LAYOUT;
};

const flushPackedRow = (
  rows: PropertyRow[],
  current: MetadataProperty[]
): { rows: PropertyRow[]; current: MetadataProperty[]; used: number } => {
  if (current.length === 0) {
    return { rows, current, used: 0 };
  }
  return { rows: [...rows, { fields: current }], current: [], used: 0 };
};

const packClassOf = (
  field: MetadataProperty,
  templatePropertyById: Map<string, ClientProperty>
): MasonryPackClass => packClassForProperty(field, templatePropertyById.get(field._id));

const minPxForPackClass = (packClass: MasonryPackClass): number =>
  packClass === 'media' ? MEDIA_CARD_MIN_PX : COMPACT_CARD_MIN_PX;

type PackCursor = {
  current: MetadataProperty[];
  widthPx: number;
  usedPx: number;
  byId: Map<string, ClientProperty>;
};

const canJoinCurrentRow = (field: MetadataProperty, cursor: PackCursor): boolean => {
  const [first] = cursor.current;
  if (!first || cursor.widthPx <= 0) {
    return false;
  }
  const packClass = packClassOf(field, cursor.byId);
  const minPx = minPxForPackClass(packClass);
  if (
    packClass === 'block' ||
    packClassOf(first, cursor.byId) !== packClass ||
    cursor.usedPx + PROPERTY_ROW_GAP_PX + minPx > cursor.widthPx
  ) {
    return false;
  }
  return packClass !== 'media' || cursor.current.length < MEDIA_MAX_PER_ROW;
};

const packPropertyRows = (
  fields: MetadataProperty[],
  containerWidthPx: number,
  templatePropertyById: Map<string, ClientProperty>
): PropertyRow[] => {
  let rows: PropertyRow[] = [];
  let current: MetadataProperty[] = [];
  let used = 0;

  fields.forEach(field => {
    if (
      !canJoinCurrentRow(field, {
        current,
        widthPx: containerWidthPx,
        usedPx: used,
        byId: templatePropertyById,
      })
    ) {
      ({ rows, current, used } = flushPackedRow(rows, current));
    }
    if (packClassOf(field, templatePropertyById) === 'block') {
      rows.push({ fields: [field] });
      return;
    }
    current.push(field);
    const minPx = minPxForPackClass(packClassOf(field, templatePropertyById));
    used = current.length === 1 ? minPx : used + PROPERTY_ROW_GAP_PX + minPx;
  });
  return flushPackedRow(rows, current).rows;
};

const hasFilledSpecializedValues = (data: MetadataProperty): boolean => {
  if (data.type === 'image' || data.type === 'preview' || data.type === 'media') {
    return data.values.some(value => Boolean(value.value));
  }
  if (data.type === 'geolocation') {
    return data.values.length > 0;
  }
  if (data.type === 'markdown') {
    return data.values.some(value => Boolean(String(value.value ?? '').trim()));
  }
  return true;
};

const templatePropertyInherits = (templateProperty: ClientProperty | undefined): boolean =>
  Boolean(templateProperty?.inherit);

const includeInMasonry = (field: MetadataProperty): boolean =>
  isRelationshipProperty(field) ||
  !isSpecializedFullWidthField(field) ||
  hasFilledSpecializedValues(field);

type MetadataRecordPartition = {
  masonryFields: MetadataProperty[];
  inheritingRels: RelationshipMetadataProperty[];
};

const inheritGroupPrimaries = (
  inheritingRels: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>
): RelationshipMetadataProperty[] => {
  const seen = new Set<string>();
  return inheritingRels.filter(field => {
    if (!field.values.length) return false;
    const groupKey = inheritGroupKey(field, templatePropertyById);
    if (seen.has(groupKey)) return false;
    seen.add(groupKey);
    return true;
  });
};

const partitionMetadataRecord = (
  otherFields: MetadataProperty[],
  relationshipFields: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>
): MetadataRecordPartition => {
  const templateProperties = [...templatePropertyById.values()];
  const inheritingRels = sortByTemplatePropertyOrder(
    relationshipFields.filter(isInheritingRelationship),
    templateProperties
  );

  return {
    masonryFields: sortByTemplatePropertyOrder(
      [
        ...otherFields,
        ...relationshipFields.filter(isLinkOnlyRelationship),
        ...inheritGroupPrimaries(inheritingRels, templatePropertyById),
      ],
      templateProperties
    ).filter(includeInMasonry),
    inheritingRels,
  };
};

export {
  LONG_FIELD_CHAR_THRESHOLD,
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
  COMPACT_CARD_MIN_PX,
  MEDIA_CARD_MIN_PX,
  PROPERTY_ROW_GAP_PX,
  isSpecializedFullWidthField,
  isLongField,
  isRelationshipProperty,
  isLinkOnlyRelationship,
  isInheritingRelationship,
  inheritGroupKey,
  metadataGridClassForProperty,
  packClassForProperty,
  packPropertyRows,
  partitionMetadataRecord,
  hasFilledSpecializedValues,
  templatePropertyInherits,
};
export type { MetadataTemplateField, MetadataRecordPartition, MasonryPackClass, PropertyRow };
