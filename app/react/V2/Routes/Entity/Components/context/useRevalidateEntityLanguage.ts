import { useEffect, type MutableRefObject } from 'react';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { seedLoaderCache } from './entityLanguageUtils.js';
import type { ApplyLanguageResult } from './useApplyEntityLanguage.js';

const useRevalidateEntityLanguage = ({
  loaderEntity,
  loaderLanguage,
  initialMainDocument,
  languageRef,
  applyLanguageRef,
  setMainDocument,
  fallbackToLoader,
}: {
  loaderEntity: Entity;
  loaderLanguage: string;
  initialMainDocument?: FileType;
  languageRef: MutableRefObject<string>;
  applyLanguageRef: MutableRefObject<(nextLanguage: string) => Promise<ApplyLanguageResult>>;
  setMainDocument: (document: FileType | undefined) => void;
  fallbackToLoader: () => void;
}) => {
  useEffect(() => {
    seedLoaderCache(loaderEntity, loaderLanguage, initialMainDocument);

    if (loaderLanguage === languageRef.current) {
      setMainDocument(initialMainDocument);
      return undefined;
    }

    let cancelled = false;
    applyLanguageRef
      .current(languageRef.current)
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
  }, [
    loaderEntity,
    loaderLanguage,
    initialMainDocument,
    languageRef,
    applyLanguageRef,
    setMainDocument,
    fallbackToLoader,
  ]);
};

export { useRevalidateEntityLanguage };
