import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';

/** Translatable property values of every language other than the target language, keyed by language. */
type EntityTranslationsDTO = Record<string, Record<string, MetadataObjectSchema[]>>;

/** An entity in the target language of the request together with its other translations. */
type EntityWithTranslations = EntityWithFilesSchema & {
  translations: EntityTranslationsDTO;
};

export type { EntityTranslationsDTO, EntityWithTranslations };
