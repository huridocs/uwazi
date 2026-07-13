import type { TemplateProperty } from './types.js';

type MediaProperty = TemplateProperty & { type: 'image' | 'media' };

type LegacyMetadataObject = { data?: string | File; originalFile?: File | null };

type MetadataObjectSchemaLike = { value?: unknown };

type LegacyMetadataValue =
  string | null | undefined | LegacyMetadataObject | MetadataObjectSchemaLike[];

type LegacyAttachment = {
  fileLocalID?: string;
  serializedFile?: string;
  timeLinks?: string;
  originalname?: string;
  filename?: string;
  type?: string;
  mimetype?: string;
};

type LegacyEntity = {
  metadata?: Record<string, LegacyMetadataValue>;
  attachments?: LegacyAttachment[];
  file?: unknown;
};

type LegacyTemplate = {
  properties?: TemplateProperty[];
};

const isMediaProperty = (property?: TemplateProperty): property is MediaProperty =>
  Boolean(property && (property.type === 'image' || property.type === 'media'));

const shouldSkipValue = (fieldValue: LegacyMetadataValue): boolean => {
  if (fieldValue === null || fieldValue === undefined) {
    return true;
  }
  if (typeof fieldValue === 'string' && fieldValue.startsWith('blob:')) {
    return true;
  }
  if (
    typeof fieldValue === 'object' &&
    !Array.isArray(fieldValue) &&
    'data' in fieldValue &&
    typeof fieldValue.data === 'string' &&
    fieldValue.data.startsWith('blob:') &&
    !fieldValue.originalFile
  ) {
    return true;
  }
  return false;
};

export { isMediaProperty, shouldSkipValue };
export type {
  LegacyAttachment,
  LegacyEntity,
  LegacyMetadataObject,
  LegacyMetadataValue,
  LegacyTemplate,
  MediaProperty,
  MetadataObjectSchemaLike,
};
