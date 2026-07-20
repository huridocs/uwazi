import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../../urlParams.js';
import {
  applyLanguageSnapshot,
  fetchEntityForLanguage,
  resolveMainDocument,
  resolvePlaintext,
  type ApplyLanguageResult,
  type LanguageSnapshotSetters,
} from '../entityLanguageUtils.js';
import { useLoaderLanguageSync, useSyncPagePlaintext } from './useEntityLanguageSync.js';

type UseEntityLanguageStateParams = {
  loaderEntity: Entity;
  initialLanguage: string;
  initialMainDocument?: FileType;
  initialPagePlaintext?: string;
  defaultLanguage?: string;
  setEntity: (entity: Entity) => void;
};

const useApplyLanguage = (
  loaderEntity: Entity,
  defaultLanguage: string | undefined,
  setters: LanguageSnapshotSetters
) => {
  const [searchParams] = useSearchParams();
  const applyGenerationRef = useRef(0);
  const invalidateApply = useCallback(() => {
    applyGenerationRef.current += 1;
  }, []);

  const applyLanguage = useCallback(
    // eslint-disable-next-line max-statements
    async (nextLanguage: string): Promise<ApplyLanguageResult> => {
      const { sharedId } = loaderEntity;
      if (!sharedId) return 'failed';

      applyGenerationRef.current += 1;
      const generation = applyGenerationRef.current;
      const isCurrent = () => generation === applyGenerationRef.current;
      const nextEntity = await fetchEntityForLanguage(sharedId, nextLanguage);
      if (!isCurrent()) return 'stale';
      if (!nextEntity) return 'failed';

      const nextMainDocument = resolveMainDocument(
        sharedId,
        nextLanguage,
        nextEntity.documents,
        defaultLanguage
      );
      const nextPlaintext = await resolvePlaintext(nextMainDocument, {
        isRaw: searchParams.get(VIEW_MODE_PARAM) === 'true',
        page: Number(searchParams.get(PAGE_PARAM) || '1'),
      });
      if (!isCurrent()) return 'stale';

      applyLanguageSnapshot(
        {
          language: nextLanguage,
          entity: nextEntity,
          mainDocument: nextMainDocument,
          pagePlaintext: nextPlaintext,
        },
        setters
      );
      return 'applied';
    },
    [loaderEntity, defaultLanguage, setters, searchParams]
  );

  return { applyLanguage, invalidateApply };
};

const useLanguageLocalState = (
  initialLanguage: string,
  initialMainDocument: FileType | undefined,
  initialPagePlaintext: string | undefined
) => {
  const [language, setLanguageState] = useState(initialLanguage);
  const [mainDocument, setMainDocument] = useState(initialMainDocument);
  const [pagePlaintext, setPagePlaintext] = useState(initialPagePlaintext);
  const [isLoading, setIsLoading] = useState(false);
  const languageRef = useRef(language);
  const isLoadingRef = useRef(isLoading);
  languageRef.current = language;
  isLoadingRef.current = isLoading;
  return {
    language,
    mainDocument,
    pagePlaintext,
    isLoading,
    setLanguageState,
    setMainDocument,
    setPagePlaintext,
    setIsLoading,
    languageRef,
    isLoadingRef,
  };
};

const useEntityLanguageState = ({
  loaderEntity,
  initialLanguage,
  initialMainDocument,
  initialPagePlaintext,
  defaultLanguage,
  setEntity,
}: UseEntityLanguageStateParams) => {
  const loaderLanguage = loaderEntity.language || initialLanguage;
  const {
    language,
    mainDocument,
    pagePlaintext,
    isLoading,
    setLanguageState,
    setMainDocument,
    setPagePlaintext,
    setIsLoading,
    languageRef,
    isLoadingRef,
  } = useLanguageLocalState(initialLanguage, initialMainDocument, initialPagePlaintext);
  const setters: LanguageSnapshotSetters = useMemo(
    () => ({ setLanguageState, setEntity, setMainDocument, setPagePlaintext }),
    [setEntity, setLanguageState, setMainDocument, setPagePlaintext]
  );
  const { applyLanguage, invalidateApply } = useApplyLanguage(
    loaderEntity,
    defaultLanguage,
    setters
  );
  const fallbackToLoader = useCallback(() => {
    invalidateApply();
    applyLanguageSnapshot(
      {
        language: loaderLanguage,
        entity: loaderEntity,
        mainDocument: initialMainDocument,
        pagePlaintext: initialPagePlaintext,
      },
      setters
    );
  }, [
    invalidateApply,
    loaderLanguage,
    loaderEntity,
    initialMainDocument,
    initialPagePlaintext,
    setters,
  ]);
  const setLanguage = useCallback(
    async (nextLanguage: string) => {
      if (nextLanguage === languageRef.current || isLoadingRef.current) return;
      setIsLoading(true);
      try {
        if ((await applyLanguage(nextLanguage)) === 'failed') {
          notify(t('System', 'An error occurred', null, false), 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [applyLanguage, languageRef, isLoadingRef, setIsLoading]
  );

  useLoaderLanguageSync({
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
    invalidateApply,
  });
  useSyncPagePlaintext({ mainDocument, setPagePlaintext });

  return { language, mainDocument, pagePlaintext, isLoading, setLanguage };
};

export { useEntityLanguageState };
export type { ApplyLanguageResult };
