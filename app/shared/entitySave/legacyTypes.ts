import type { TemplateProperty } from './types.js';

type MediaProperty = TemplateProperty & { type: 'image' | 'media' };

type LegacyMetadataObject = { data?: string | File; originalFile?: File | null };

type MetadataObjectSchemaLike = { value?: unknown };

type LegacyMetadataPrimitive = string | number | boolean | null | undefined;

type LegacyMetadataValue =
  | LegacyMetadataPrimitive
  | LegacyMetadataObject
  | ReadonlyArray<LegacyMetadataPrimitive | MetadataObjectSchemaLike>;

type LegacyAttachment = {
  fileLocalID?: string;
  serializedFile?: string;
  timeLinks?: string;
  originalname?: string;
  filename?: string;
  type?: string;
  mimetype?: string;
};

type WrapableAttachment = {
  fileLocalID?: string;
  timeLinks?: string;
};

type WrapableEntity = {
  title?: string;
  template?: unknown;
  metadata?: Record<string, unknown> | null;
  attachments?: ReadonlyArray<WrapableAttachment> | null;
};

type LegacyEntity = WrapableEntity & {
  title?: string;
  template?: unknown;
  metadata?: Record<string, LegacyMetadataValue> | null;
  attachments?: Array<LegacyAttachment | File> | null;
  file?: File | File[] | undefined;
};

type LegacyTemplate = {
  _id?: unknown;
  properties?: ReadonlyArray<TemplateProperty> | null;
};

const isMediaProperty = (property?: TemplateProperty): property is MediaProperty =>
  Boolean(property && (property.type === 'image' || property.type === 'media'));

const isLegacyMetadataObject = (value: unknown): value is LegacyMetadataObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && 'data' in value;

const shouldSkipValue = (fieldValue: unknown): boolean => {
  if (fieldValue === null || fieldValue === undefined) {
    return true;
  }
  if (typeof fieldValue === 'string' && fieldValue.startsWith('blob:')) {
    return true;
  }
  if (
    isLegacyMetadataObject(fieldValue) &&
    typeof fieldValue.data === 'string' &&
    fieldValue.data.startsWith('blob:') &&
    !fieldValue.originalFile
  ) {
    return true;
  }
  return false;
};

export { isLegacyMetadataObject, isMediaProperty, shouldSkipValue };
export type {
  LegacyAttachment,
  LegacyEntity,
  LegacyMetadataObject,
  LegacyMetadataPrimitive,
  LegacyMetadataValue,
  LegacyTemplate,
  MediaProperty,
  MetadataObjectSchemaLike,
  WrapableAttachment,
  WrapableEntity,
};
