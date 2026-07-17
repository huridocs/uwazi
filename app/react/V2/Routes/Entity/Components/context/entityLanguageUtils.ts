import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { availableLanguages } from '#shared/language/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { getPagePlaintext } from '#V2/api/files/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { httpServices } from '#V2/services/http/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';

const resolveRtl = (languageKey: string, languages: LanguagesListSchema): boolean => {
  const fromSettings = languages.find(language => language.key === languageKey)?.rtl;
  if (typeof fromSettings === 'boolean') {
    return fromSettings;
  }
  return Boolean(availableLanguages.find(language => language.key === languageKey)?.rtl);
};

const getClientSearchParam = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return new URLSearchParams(window.location.search).get(key);
};

const seedLoaderCache = (entity: Entity, language: string, mainDocument?: FileType) => {
  if (!entity.sharedId) {
    return;
  }
  entityLoaderCache.setEntity(entity.sharedId, language, entity);
  if (mainDocument) {
    entityLoaderCache.setMainDocument(entity.sharedId, language, mainDocument);
  }
};

const resolveMainDocument = (
  sharedId: string,
  nextLanguage: string,
  documents: Entity['documents'],
  defaultLanguage?: string
) => {
  const cached = entityLoaderCache.getMainDocument(sharedId, nextLanguage);
  const nextMainDocument = cached ?? getMainDocument(documents, nextLanguage, defaultLanguage);
  if (nextMainDocument) {
    entityLoaderCache.setMainDocument(sharedId, nextLanguage, nextMainDocument);
  }
  return nextMainDocument;
};

const fetchEntityForLanguage = async (sharedId: string, nextLanguage: string) => {
  const cached = entityLoaderCache.getEntity(sharedId, nextLanguage, {
    requireRelationships: true,
  });
  if (cached) {
    return cached;
  }

  const [fetched, error] = await httpServices.entities.getBySharedId(sharedId, {
    language: nextLanguage,
    omitRelationships: false,
  });
  if (error || !fetched?.[0]?._id) {
    return undefined;
  }

  const [nextEntity] = fetched;
  entityLoaderCache.setEntity(sharedId, nextLanguage, nextEntity);
  return nextEntity;
};

// eslint-disable-next-line max-statements
const resolvePlaintext = async (document: FileType | undefined) => {
  const isRaw = getClientSearchParam(VIEW_MODE_PARAM) === 'true';
  if (!isRaw || !document?._id) {
    return undefined;
  }

  const page = Number(getClientSearchParam(PAGE_PARAM) || '1');
  const cached = entityLoaderCache.getPlaintext(document._id, page);
  if (cached !== undefined) {
    return cached;
  }

  const response = await getPagePlaintext(document._id, page);
  if (response instanceof FetchResponseError) {
    return undefined;
  }

  entityLoaderCache.setPlaintext(document._id, page, response);
  return response;
};

export {
  resolveRtl,
  seedLoaderCache,
  resolveMainDocument,
  fetchEntityForLanguage,
  resolvePlaintext,
};
