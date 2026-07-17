import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { resolveRtl } from './entityLanguageUtils.js';
import { useApplyEntityLanguage } from './useApplyEntityLanguage.js';
import type { ApplyLanguageResult } from './useApplyEntityLanguage.js';
import { useEntityContext } from './EntityContext.js';
import { useEntityLanguageActions } from './useEntityLanguageActions.js';
import { useRevalidateEntityLanguage } from './useRevalidateEntityLanguage.js';
import { useSyncPagePlaintext } from './useSyncPagePlaintext.js';

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
  const loaderLanguage = loaderEntity.language || initialLanguage;

  const [language, setLanguageState] = useState(initialLanguage);
  const [mainDocument, setMainDocument] = useState(initialMainDocument);
  const [pagePlaintext, setPagePlaintext] = useState(initialPagePlaintext);
  const languageRef = useRef(language);
  languageRef.current = language;
  const applyLanguageRef = useRef<(nextLanguage: string) => Promise<ApplyLanguageResult>>(
    async () => 'failed'
  );

  const applyLanguage = useApplyEntityLanguage({
    loaderEntity,
    defaultLanguage,
    setEntity,
    setMainDocument,
    setLanguageState,
    setPagePlaintext,
  });
  applyLanguageRef.current = applyLanguage;

  const {
    isLoading,
    isLoadingRef,
    fallbackToLoader,
    setLanguage: applySetLanguage,
  } = useEntityLanguageActions({
    applyLanguage,
    loaderLanguage,
    loaderEntity,
    initialMainDocument,
    initialPagePlaintext,
    setLanguageState,
    setMainDocument,
    setEntity,
    setPagePlaintext,
  });

  useRevalidateEntityLanguage({
    loaderEntity,
    loaderLanguage,
    initialMainDocument,
    languageRef,
    isLoadingRef,
    applyLanguageRef,
    setMainDocument,
    fallbackToLoader,
  });

  useSyncPagePlaintext({
    loaderLanguage,
    uiLanguage: language,
    initialPagePlaintext,
    mainDocument,
    setPagePlaintext,
  });

  const setLanguage = useCallback(
    async (nextLanguage: string) => applySetLanguage(nextLanguage, languageRef.current),
    [applySetLanguage]
  );

  const value = useMemo(
    () => ({
      language,
      languages,
      isRtl: resolveRtl(language, languages),
      isLoading,
      mainDocument,
      pagePlaintext,
      setLanguage,
    }),
    [language, languages, isLoading, mainDocument, pagePlaintext, setLanguage]
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
