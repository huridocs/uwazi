import type { MutableRefObject } from 'react';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { availableLanguages } from '#shared/language/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { getPagePlaintext } from '#V2/api/files/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { httpServices } from '#V2/services/http/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';

type ApplyLanguageResult = 'applied' | 'stale' | 'failed';

const resolveRtl = (languageKey: string, languages: LanguagesListSchema): boolean => {
  const fromSettings = languages.find(language => language.key === languageKey)?.rtl;
  if (typeof fromSettings === 'boolean') {
    return fromSettings;
  }
  return Boolean(availableLanguages.find(language => language.key === languageKey)?.rtl);
};

type PlaintextQuery = {
  isRaw: boolean;
  page: number;
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
  const nextMainDocument =
    getMainDocument(documents, nextLanguage, defaultLanguage) ??
    entityLoaderCache.getMainDocument(sharedId, nextLanguage);
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

const resolvePlaintext = async (document: FileType | undefined, query: PlaintextQuery) => {
  if (!query.isRaw || !document?._id) {
    return undefined;
  }

  const cached = entityLoaderCache.getPlaintext(document._id, query.page);
  if (cached !== undefined) {
    return cached;
  }

  const response = await getPagePlaintext(document._id, query.page);
  if (response instanceof FetchResponseError) {
    return undefined;
  }

  entityLoaderCache.setPlaintext(document._id, query.page, response);
  return response;
};

type LanguageSnapshot = {
  language: string;
  entity: Entity;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

type LanguageSnapshotSetters = {
  setLanguageState: (language: string) => void;
  setEntity: (entity: Entity) => void;
  setMainDocument: (document: FileType | undefined) => void;
  setPagePlaintext: (text: string | undefined) => void;
};

const applyLanguageSnapshot = (snapshot: LanguageSnapshot, setters: LanguageSnapshotSetters) => {
  setters.setMainDocument(snapshot.mainDocument);
  setters.setLanguageState(snapshot.language);
  setters.setEntity(snapshot.entity);
  setters.setPagePlaintext(snapshot.pagePlaintext);
};

const revalidateUiLanguage = (
  applyLanguage: (nextLanguage: string) => Promise<ApplyLanguageResult>,
  language: string,
  fallbackToLoader: () => void
) => {
  let cancelled = false;
  applyLanguage(language)
    .then(result => {
      if (!cancelled && result === 'failed') {
        fallbackToLoader();
      }
    })
    .catch(() => {
      if (!cancelled) {
        fallbackToLoader();
      }
    });
  return () => {
    cancelled = true;
  };
};

type SyncLoaderLanguageMode = 'adopt-loader' | 'match-loader-docs' | 'keep-ui' | 'seed-only';

const resolveSyncMode = ({
  loaderLanguageChanged,
  pendingAdopt,
  preserveUiLanguage,
  loaderLanguage,
  uiLanguage,
}: {
  loaderLanguageChanged: boolean;
  pendingAdopt: boolean;
  preserveUiLanguage: boolean;
  loaderLanguage: string;
  uiLanguage: string;
}): { mode: SyncLoaderLanguageMode; pendingAdopt: boolean } => {
  if (preserveUiLanguage) {
    return {
      mode: 'seed-only',
      pendingAdopt: loaderLanguageChanged || pendingAdopt,
    };
  }
  if (loaderLanguageChanged || pendingAdopt) {
    return { mode: 'adopt-loader', pendingAdopt: false };
  }
  if (loaderLanguage === uiLanguage) {
    return { mode: 'match-loader-docs', pendingAdopt: false };
  }
  return { mode: 'keep-ui', pendingAdopt: false };
};

// eslint-disable-next-line max-statements
const syncLoaderLanguage = ({
  mode,
  loaderEntity,
  loaderLanguage,
  initialMainDocument,
  initialPagePlaintext,
  languageRef,
  isLoadingRef,
  setMainDocument,
  setPagePlaintext,
  applyLanguage,
  fallbackToLoader,
}: {
  mode: SyncLoaderLanguageMode;
  loaderEntity: Entity;
  loaderLanguage: string;
  initialMainDocument?: FileType;
  initialPagePlaintext?: string;
  languageRef: MutableRefObject<string>;
  isLoadingRef: MutableRefObject<boolean>;
  setMainDocument: (document: FileType | undefined) => void;
  setPagePlaintext: (text: string | undefined) => void;
  applyLanguage: (nextLanguage: string) => Promise<ApplyLanguageResult>;
  fallbackToLoader: () => void;
}) => {
  seedLoaderCache(loaderEntity, loaderLanguage, initialMainDocument);

  if (mode === 'seed-only') {
    return undefined;
  }

  if (mode === 'adopt-loader') {
    fallbackToLoader();
    return undefined;
  }

  if (mode === 'match-loader-docs') {
    setMainDocument(initialMainDocument);
    setPagePlaintext(initialPagePlaintext);
    return undefined;
  }

  return isLoadingRef.current
    ? undefined
    : revalidateUiLanguage(applyLanguage, languageRef.current, fallbackToLoader);
};

export {
  resolveRtl,
  seedLoaderCache,
  resolveMainDocument,
  fetchEntityForLanguage,
  resolvePlaintext,
  applyLanguageSnapshot,
  resolveSyncMode,
  syncLoaderLanguage,
};
export type {
  LanguageSnapshot,
  LanguageSnapshotSetters,
  ApplyLanguageResult,
  SyncLoaderLanguageMode,
  PlaintextQuery,
};
