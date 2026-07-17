import { useCallback, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { notify } from '#V2/utils/notifyBridge.js';
import type { ApplyLanguageResult } from './useApplyEntityLanguage.js';

const useEntityLanguageActions = ({
  applyLanguage,
  loaderLanguage,
  loaderEntity,
  initialMainDocument,
  initialPagePlaintext,
  setLanguageState,
  setMainDocument,
  setEntity,
  setPagePlaintext,
}: {
  applyLanguage: (nextLanguage: string) => Promise<ApplyLanguageResult>;
  loaderLanguage: string;
  loaderEntity: Entity;
  initialMainDocument?: FileType;
  initialPagePlaintext?: string;
  setLanguageState: (language: string) => void;
  setMainDocument: (document: FileType | undefined) => void;
  setEntity: (entity: Entity) => void;
  setPagePlaintext: (text: string | undefined) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const fallbackToLoader = useCallback(() => {
    setLanguageState(loaderLanguage);
    setMainDocument(initialMainDocument);
    setEntity(loaderEntity);
    setPagePlaintext(initialPagePlaintext);
  }, [
    loaderLanguage,
    initialMainDocument,
    loaderEntity,
    initialPagePlaintext,
    setLanguageState,
    setMainDocument,
    setEntity,
    setPagePlaintext,
  ]);

  const setLanguage = useCallback(
    async (nextLanguage: string, currentLanguage: string) => {
      if (nextLanguage === currentLanguage || isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await applyLanguage(nextLanguage);
        if (result === 'failed') {
          notify(t('System', 'An error occurred', null, false), 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [applyLanguage, isLoading]
  );

  return { isLoading, isLoadingRef, fallbackToLoader, setLanguage };
};

export { useEntityLanguageActions };
