import type { ClientProperty } from '#V2/shared/types.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';

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

const FULL_ROW_FIELD_NAME = /^(description|body|abstract|summary|content|notes)$/i;

const COMPACT_METADATA_FIELD_LAYOUT = 'min-w-0 grow basis-[min(100%,18rem)]';
const FULL_ROW_METADATA_FIELD_LAYOUT = 'min-w-0 w-full basis-full shrink-0';

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

const isLinkOnlyRelationship = (field: RelationshipMetadataProperty): boolean => !field.inherited;

const isInheritingRelationship = (field: RelationshipMetadataProperty): boolean =>
  Boolean(field.inherited);

const fieldShowsInCard = (
  fieldId: string,
  templatePropertyById: Map<string, ClientProperty>
): boolean => templatePropertyById.get(fieldId)?.showInCard === true;

const fieldNamePrefersFullRow = (name: string) => FULL_ROW_FIELD_NAME.test(name);

const isLongTextProperty = (data: MetadataProperty): boolean => {
  if (data.type !== 'text') {
    return false;
  }
  const text = data.values.map(v => String(v.value ?? '')).join('\n');
  return text.length >= LONG_TEXT_CHAR_THRESHOLD || fieldNamePrefersFullRow(data.name);
};

const usesTemplateFullWidthGrid = (
  data: MetadataProperty,
  templateField: MetadataTemplateField
): boolean =>
  Boolean(templateField?.fullWidth) && TEMPLATE_FULL_WIDTH_GRID_TYPES.includes(data.type);

const metadataGridClassForProperty = (
  data: MetadataProperty,
  templateField: MetadataTemplateField
): string => {
  if (usesTemplateFullWidthGrid(data, templateField)) {
    return FULL_ROW_METADATA_FIELD_LAYOUT;
  }
  if (data.type === 'markdown' || data.type === 'geolocation' || data.type === 'media') {
    return FULL_ROW_METADATA_FIELD_LAYOUT;
  }
  if (isLongTextProperty(data)) {
    return FULL_ROW_METADATA_FIELD_LAYOUT;
  }
  return COMPACT_METADATA_FIELD_LAYOUT;
};

const hasFilledPreviewValues = (data: MetadataProperty): boolean =>
  data.type === 'preview' && data.values.some(value => Boolean(value.value));

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

type MetadataRecordPartition = {
  showDocumentPreview: boolean;
  previewField: MetadataProperty | undefined;
  leadingFields: MetadataProperty[];
  leadingLinkOnlyRels: RelationshipMetadataProperty[];
  detailFields: MetadataProperty[];
  detailLinkOnlyRels: RelationshipMetadataProperty[];
  inheritingRels: RelationshipMetadataProperty[];
};

const partitionMetadataRecord = (
  otherFields: MetadataProperty[],
  relationshipFields: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>,
  hasPrimaryDocument: boolean
): MetadataRecordPartition => {
  const previewField = otherFields.find(hasFilledPreviewValues);
  const showDocumentPreview = hasPrimaryDocument || Boolean(previewField);
  const consumedPreviewId = showDocumentPreview && previewField ? previewField._id : undefined;

  const leadingFields: MetadataProperty[] = [];
  const detailFields: MetadataProperty[] = [];

  otherFields.forEach(field => {
    if (field._id === consumedPreviewId) {
      return;
    }
    if (isSpecializedFullWidthField(field) && !hasFilledSpecializedValues(field)) {
      return;
    }
    const leading =
      fieldShowsInCard(field._id, templatePropertyById) ||
      isLongField(field) ||
      isSpecializedFullWidthField(field);
    if (leading) {
      leadingFields.push(field);
    } else {
      detailFields.push(field);
    }
  });

  const linkOnly = relationshipFields.filter(isLinkOnlyRelationship);
  const leadingLinkOnlyRels = linkOnly.filter(field =>
    fieldShowsInCard(field._id, templatePropertyById)
  );
  const detailLinkOnlyRels = linkOnly.filter(
    field => !fieldShowsInCard(field._id, templatePropertyById)
  );

  return {
    showDocumentPreview,
    previewField: showDocumentPreview ? previewField : undefined,
    leadingFields,
    leadingLinkOnlyRels,
    detailFields,
    detailLinkOnlyRels,
    inheritingRels: relationshipFields.filter(isInheritingRelationship),
  };
};

export {
  LONG_FIELD_CHAR_THRESHOLD,
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
  isSpecializedFullWidthField,
  isLongField,
  isLinkOnlyRelationship,
  isInheritingRelationship,
  fieldShowsInCard,
  metadataGridClassForProperty,
  partitionMetadataRecord,
  hasFilledPreviewValues,
  hasFilledSpecializedValues,
  templatePropertyInherits,
};
export type { MetadataTemplateField, MetadataRecordPartition };
