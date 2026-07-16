import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtomValue } from 'jotai';
import { availableLanguages } from '#shared/language/index.js';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { getPagePlaintext } from '#V2/api/files/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { httpServices } from '#V2/services/http/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';
import { useEntityContext } from './EntityContext.js';

type EntityLanguageContextValue = {
  language: string;
  languages: LanguagesListSchema;
  isRtl: boolean;
  isLoading: boolean;
  mainDocument?: FileType;
  pagePlaintext?: string;
  setLanguage: (language: string) => Promise<void>;
};

const EntityLanguageContext = createContext<EntityLanguageContextValue | null>(null);

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

type EntityLanguageProviderProps = {
  loaderEntity: Entity;
  initialLanguage: string;
  initialMainDocument?: FileType;
  initialPagePlaintext?: string;
  children: React.ReactNode;
};

const EntityLanguageProvider = ({
  loaderEntity,
  initialLanguage,
  initialMainDocument,
  initialPagePlaintext,
  children,
}: EntityLanguageProviderProps) => {
  const { setEntity } = useEntityContext();
  const settings = useAtomValue(settingsAtom);
  const languages = useMemo(() => settings.languages ?? [], [settings.languages]);
  const defaultLanguage = languages.find(language => language.default)?.key;

  const [language, setLanguageState] = useState(initialLanguage);
  const [mainDocument, setMainDocument] = useState(initialMainDocument);
  const [pagePlaintext, setPagePlaintext] = useState(initialPagePlaintext);
  const [isLoading, setIsLoading] = useState(false);
  const languageRef = useRef(language);
  languageRef.current = language;
  const applyLanguageRef = useRef<(nextLanguage: string) => Promise<void>>(async () => undefined);

  const resolvePlaintext = useCallback(async (document: FileType | undefined) => {
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
  }, []);

  const applyLanguage = useCallback(
    async (nextLanguage: string) => {
      const { sharedId } = loaderEntity;
      if (!sharedId) {
        return;
      }

      const documents =
        entityLoaderCache.getEntity(sharedId, languageRef.current)?.documents ??
        entityLoaderCache.getEntity(sharedId, nextLanguage)?.documents ??
        loaderEntity.documents;

      const nextMainDocument = resolveMainDocument(
        sharedId,
        nextLanguage,
        documents,
        defaultLanguage
      );
      setMainDocument(nextMainDocument);
      setLanguageState(nextLanguage);

      const nextEntity = await fetchEntityForLanguage(sharedId, nextLanguage);
      if (!nextEntity) {
        return;
      }

      const reconciledMainDocument = resolveMainDocument(
        sharedId,
        nextLanguage,
        nextEntity.documents,
        defaultLanguage
      );
      if (reconciledMainDocument?._id !== nextMainDocument?._id) {
        setMainDocument(reconciledMainDocument);
      }

      setEntity(nextEntity);
      setPagePlaintext(await resolvePlaintext(reconciledMainDocument ?? nextMainDocument));
    },
    [loaderEntity, defaultLanguage, setEntity, resolvePlaintext]
  );

  applyLanguageRef.current = applyLanguage;

  useEffect(() => {
    const loaderLanguage = loaderEntity.language || initialLanguage;
    seedLoaderCache(loaderEntity, loaderLanguage, initialMainDocument);

    if (loaderLanguage === languageRef.current) {
      setMainDocument(initialMainDocument);
      setPagePlaintext(initialPagePlaintext);
      return;
    }

    applyLanguageRef.current(languageRef.current).catch(() => undefined);
  }, [loaderEntity, initialLanguage, initialMainDocument, initialPagePlaintext]);

  const setLanguage = useCallback(
    async (nextLanguage: string) => {
      if (nextLanguage === languageRef.current || isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        await applyLanguage(nextLanguage);
      } finally {
        setIsLoading(false);
      }
    },
    [applyLanguage, isLoading]
  );

  const isRtl = resolveRtl(language, languages);

  const value = useMemo(
    () => ({
      language,
      languages,
      isRtl,
      isLoading,
      mainDocument,
      pagePlaintext,
      setLanguage,
    }),
    [language, languages, isRtl, isLoading, mainDocument, pagePlaintext, setLanguage]
  );

  return <EntityLanguageContext.Provider value={value}>{children}</EntityLanguageContext.Provider>;
};

const useEntityLanguage = () => {
  const context = useContext(EntityLanguageContext);
  if (!context) {
    throw new Error('Entity language context not found');
  }
  return context;
};

export { EntityLanguageProvider, useEntityLanguage };
export type { EntityLanguageContextValue };
