import type { ClientProperty } from '#V2/shared/types.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { sortByTemplatePropertyOrder } from './sortByTemplatePropertyOrder.js';
import { relationshipGroupKey } from './relationshipInherit.js';

const LONG_FIELD_CHAR_THRESHOLD = 100;

const SPECIALIZED_FULL_WIDTH_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'geolocation',
  'image',
  'preview',
  'media',
  'markdown',
];

const METADATA_FIELD_COLUMN = 'flex min-h-0 min-w-0 flex-col self-stretch';
const COMPACT_METADATA_FIELD_LAYOUT = `${METADATA_FIELD_COLUMN} flex-1`;
const MEDIA_METADATA_FIELD_LAYOUT = METADATA_FIELD_COLUMN;
const FULL_ROW_METADATA_FIELD_LAYOUT = `${METADATA_FIELD_COLUMN} w-full shrink-0 basis-full`;
const MEDIA_MASONRY_IMAGE_ROW =
  'grid w-full min-w-0 items-stretch gap-3 max-h-48 auto-rows-[12rem]';
const MEDIA_MASONRY_VIDEO_ROW =
  'grid w-full min-w-0 items-stretch gap-3 max-h-96 auto-rows-[minmax(12rem,auto)]';
const MEDIA_MASONRY_GEO_ROW =
  'grid w-full min-w-0 items-stretch gap-3 auto-rows-[minmax(18rem,auto)]';
const MEDIA_ROW_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
} as const;
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

const packClassForProperty = (data: MetadataProperty): MasonryPackClass => {
  if (
    isInheritingRelationship(data) ||
    data.type === 'markdown' ||
    isLongField(data) ||
    contentLength(data) > LONG_FIELD_CHAR_THRESHOLD
  ) {
    return 'block';
  }
  return MEDIA_PACK_TYPES.includes(data.type) ? 'media' : 'short';
};

const metadataGridClassForProperty = (data: MetadataProperty): string => {
  const packClass = packClassForProperty(data);
  if (packClass === 'block') {
    return FULL_ROW_METADATA_FIELD_LAYOUT;
  }
  if (packClass === 'media') {
    return MEDIA_METADATA_FIELD_LAYOUT;
  }
  return COMPACT_METADATA_FIELD_LAYOUT;
};

const mediaRowTrackCount = (widthPx: number): 1 | 2 | 3 => {
  if (widthPx < MEDIA_CARD_MIN_PX * 2 + PROPERTY_ROW_GAP_PX) {
    return 1;
  }
  if (widthPx < MEDIA_CARD_MIN_PX * 3 + PROPERTY_ROW_GAP_PX * 2) {
    return 2;
  }
  return MEDIA_MAX_PER_ROW;
};

const isImageMediaValue = (v: { value?: string; fileType?: string; mimetype?: string }) => {
  const mime = v.mimetype || (v.value && getMimetypeFromUrl(v.value)) || '';
  return v.fileType === 'image' || mime.startsWith('image/');
};

const isVideoMediaField = (data: MetadataProperty) =>
  data.type === 'media' && data.values.some(value => !isImageMediaValue(value));

const mediaMasonryRowClass = (widthPx: number, fields: MetadataProperty[]): string => {
  const cols = MEDIA_ROW_COLS[mediaRowTrackCount(widthPx)];
  if (fields.some(isVideoMediaField)) {
    return `${MEDIA_MASONRY_VIDEO_ROW} ${cols}`;
  }
  if (fields.some(field => field.type === 'geolocation')) {
    return `${MEDIA_MASONRY_GEO_ROW} ${cols}`;
  }
  return `${MEDIA_MASONRY_IMAGE_ROW} ${cols}`;
};

type PackRow = { current: MetadataProperty[]; used: number };
type PackWork = { rows: PropertyRow[]; row: PackRow; widthPx: number };

const flushPackedRow = (rows: PropertyRow[], current: MetadataProperty[]) => {
  if (current.length > 0) {
    rows.push({ fields: current });
  }
};

const canJoin = (field: MetadataProperty, work: PackWork): boolean => {
  const packClass = packClassForProperty(field);
  const minPx = packClass === 'media' ? MEDIA_CARD_MIN_PX : COMPACT_CARD_MIN_PX;
  const [first] = work.row.current;
  if (!first || work.widthPx <= 0 || packClass === 'block') {
    return false;
  }
  if (
    packClassForProperty(first) !== packClass ||
    work.row.used + PROPERTY_ROW_GAP_PX + minPx > work.widthPx
  ) {
    return false;
  }
  return packClass !== 'media' || work.row.current.length < MEDIA_MAX_PER_ROW;
};

const packOneField = (field: MetadataProperty, work: PackWork) => {
  const packClass = packClassForProperty(field);
  const minPx = packClass === 'media' ? MEDIA_CARD_MIN_PX : COMPACT_CARD_MIN_PX;
  if (!canJoin(field, work)) {
    flushPackedRow(work.rows, work.row.current);
    work.row = { current: [], used: 0 };
  }
  if (packClass === 'block') {
    work.rows.push({ fields: [field] });
    return;
  }
  work.row.current.push(field);
  work.row.used =
    work.row.current.length === 1 ? minPx : work.row.used + PROPERTY_ROW_GAP_PX + minPx;
};

const packPropertyRows = (fields: MetadataProperty[], widthPx: number): PropertyRow[] => {
  const work: PackWork = { rows: [], row: { current: [], used: 0 }, widthPx };
  fields.forEach(field => packOneField(field, work));
  flushPackedRow(work.rows, work.row.current);
  return work.rows;
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

const groupInheritingRelationships = (
  fields: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>
): Map<string, RelationshipMetadataProperty[]> => {
  const groups = new Map<string, RelationshipMetadataProperty[]>();
  fields.forEach(field => {
    if (!isInheritingRelationship(field)) {
      return;
    }
    const groupKey = inheritGroupKey(field, templatePropertyById);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), field]);
  });
  return groups;
};

const inheritGroupPrimaries = (
  inheritingRels: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>
): RelationshipMetadataProperty[] =>
  [...groupInheritingRelationships(inheritingRels, templatePropertyById).values()].flatMap(
    siblings => siblings.find(field => field.values.length > 0) ?? []
  );

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
  MEDIA_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
  COMPACT_CARD_MIN_PX,
  MEDIA_CARD_MIN_PX,
  MEDIA_MAX_PER_ROW,
  PROPERTY_ROW_GAP_PX,
  isSpecializedFullWidthField,
  isLongField,
  isRelationshipProperty,
  isLinkOnlyRelationship,
  isInheritingRelationship,
  inheritGroupKey,
  groupInheritingRelationships,
  metadataGridClassForProperty,
  mediaMasonryRowClass,
  mediaRowTrackCount,
  packClassForProperty,
  packPropertyRows,
  partitionMetadataRecord,
  hasFilledSpecializedValues,
  templatePropertyInherits,
};
export type { MetadataRecordPartition, MasonryPackClass, PropertyRow };
