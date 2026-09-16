import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';

/** Translatable property values of every language other than the root one, keyed by language. */
type EntityTranslationsDTO = Record<string, Record<string, MetadataObjectSchema[]>>;

/** An entity in the request language (root) together with its other translations. */
type EntityWithTranslations = EntityWithFilesSchema & {
  translations: EntityTranslationsDTO;
};

export type { EntityTranslationsDTO, EntityWithTranslations };
