import type { MetadataProperty } from '#V2/formatters/types.js';

type MetadataTemplateField = { fullWidth?: boolean } | undefined;

const LONG_TEXT_CHAR_THRESHOLD = 160;

const FULL_ROW_FIELD_NAME = /^(description|body|abstract|summary|content|notes)$/i;

const METADATA_GRID_CLASS_BY_TYPE: Partial<Record<MetadataProperty['type'], string>> = {
  markdown: 'col-span-full',
  geolocation: 'col-span-full',
};

const TEMPLATE_FULL_WIDTH_GRID_TYPES: ReadonlyArray<MetadataProperty['type']> = [
  'image',
  'preview',
  'media',
];

const FULL_ROW_GRID_CLASS = 'col-span-full';

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
): string | undefined => {
  if (usesTemplateFullWidthGrid(data, templateField)) {
    return FULL_ROW_GRID_CLASS;
  }
  const byType = METADATA_GRID_CLASS_BY_TYPE[data.type];
  if (byType) {
    return byType;
  }
  if (isLongTextProperty(data)) {
    return FULL_ROW_GRID_CLASS;
  }
  return undefined;
};

export { metadataGridClassForProperty };
export type { MetadataTemplateField };
