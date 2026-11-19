import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';

type StoredPropertyAttributes = {
  values: unknown[];
  attributes: (string[] | undefined)[];
};

type MetadataAttributesSidecar = Record<string, StoredPropertyAttributes>;

const stringAttributes = (entry: unknown): string[] | undefined => {
  if (typeof entry !== 'object' || entry === null || !('attributes' in entry)) {
    return undefined;
  }
  const { attributes } = entry as { attributes?: unknown };
  if (!Array.isArray(attributes) || attributes.some(item => typeof item !== 'string')) {
    return undefined;
  }
  return attributes;
};

const entryValue = (entry: unknown): unknown => {
  if (typeof entry === 'object' && entry !== null && 'value' in entry) {
    return (entry as { value: unknown }).value;
  }
  return entry;
};

const collectMetadataAttributes = (
  metadata: Record<string, unknown> | null | undefined
): MetadataAttributesSidecar | undefined => {
  if (!metadata) {
    return undefined;
  }
  const sidecar: MetadataAttributesSidecar = {};
  Object.entries(metadata).forEach(([name, raw]) => {
    if (!Array.isArray(raw) || raw.length === 0) {
      return;
    }
    const attributes = raw.map(stringAttributes);
    if (attributes.every(item => item === undefined)) {
      return;
    }
    sidecar[name] = { values: raw.map(entryValue), attributes };
  });
  return Object.keys(sidecar).length > 0 ? sidecar : undefined;
};

const withAttributes = (
  entry: MetadataObjectSchema,
  attributes: string[] | undefined
): MetadataObjectSchema => {
  if (attributes === undefined || entry.attributes !== undefined) {
    return entry;
  }
  return { ...entry, attributes };
};

const applyStoredAttributes = (
  wrapped: MetadataObjectSchema[],
  stored: StoredPropertyAttributes | undefined
): MetadataObjectSchema[] => {
  if (!stored) {
    return wrapped;
  }
  if (stored.attributes.length !== wrapped.length) {
    return wrapped;
  }
  return wrapped.map((entry, index) => withAttributes(entry, stored.attributes[index]));
};

const omitMetadataAttributes = <T extends object>(entity: T): Omit<T, 'metadataAttributes'> => {
  if (!('metadataAttributes' in entity)) {
    return entity;
  }
  const { metadataAttributes: _removed, ...rest } = entity as T & {
    metadataAttributes?: unknown;
  };
  return rest;
};

export { applyStoredAttributes, collectMetadataAttributes, omitMetadataAttributes };
export type { MetadataAttributesSidecar, StoredPropertyAttributes };
