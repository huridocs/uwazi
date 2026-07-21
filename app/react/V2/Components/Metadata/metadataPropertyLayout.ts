import type { MetadataProperty } from '#V2/formatters/types.js';

type MetadataTemplateField = { fullWidth?: boolean } | undefined;

const LONG_TEXT_CHAR_THRESHOLD = 160;

const FULL_ROW_FIELD_NAME = /^(description|body|abstract|summary|content|notes)$/i;

const COMPACT_METADATA_FIELD_LAYOUT = 'min-w-0 grow basis-[min(100%,18rem)]';

const FULL_ROW_METADATA_FIELD_LAYOUT = 'min-w-0 w-full basis-full shrink-0';

const TEMPLATE_FULL_WIDTH_GRID_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'image',
  'preview',
  'media',
];

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

export {
  metadataGridClassForProperty,
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
};
export type { MetadataTemplateField };
