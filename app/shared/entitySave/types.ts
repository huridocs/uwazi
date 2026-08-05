import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';

type MediaPropertyType = 'image' | 'media';

type MediaPropertyContext = {
  names: ReadonlySet<string>;
  types: ReadonlyMap<string, MediaPropertyType>;
};

type TemplateProperty = {
  name: string;
  type: string;
};

type EntitySaveMetadata = Record<string, MetadataObjectSchema[] | undefined>;

type EntityWithSaveMetadata = {
  metadata?: EntitySaveMetadata;
  attachments?: ReadonlyArray<{
    fileLocalID?: string;
    serializedFile?: string;
    timeLinks?: string;
  }>;
};

export type {
  EntitySaveMetadata,
  EntityWithSaveMetadata,
  MediaPropertyContext,
  MediaPropertyType,
  TemplateProperty,
};
