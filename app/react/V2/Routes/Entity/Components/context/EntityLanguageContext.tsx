import React, { createContext, useContext, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { resolveRtl } from './entityLanguageUtils.js';
import { useEntityContext } from './EntityContext.js';
import { useEntityLanguageState } from './hooks/useEntityLanguageState.js';

type EntityLanguageContextValue = {
  language: string;
  languages: LanguagesListSchema;
  translations: EntityTranslationsDTO;
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
  const { entity, setEntity } = useEntityContext();
  const settings = useAtomValue(settingsAtom);
  const languages = useMemo(() => settings.languages ?? [], [settings.languages]);
  const defaultLanguage = languages.find(item => item.default)?.key;

  const { language, mainDocument, pagePlaintext, isLoading, setLanguage } = useEntityLanguageState({
    loaderEntity,
    initialLanguage,
    initialMainDocument,
    initialPagePlaintext,
    defaultLanguage,
    setEntity,
  });

  const value = useMemo(
    () => ({
      language,
      languages,
      translations: entity.translations ?? {},
      isRtl: resolveRtl(language),
      isLoading,
      mainDocument,
      pagePlaintext,
      setLanguage,
    }),
    [entity.translations, language, languages, isLoading, mainDocument, pagePlaintext, setLanguage]
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

const useOptionalEntityLanguage = () => useContext(EntityLanguageContext);

export { EntityLanguageProvider, useEntityLanguage, useOptionalEntityLanguage };
export type { EntityLanguageContextValue };
