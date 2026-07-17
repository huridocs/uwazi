import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useSearchParams } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../../urlParams.js';
import {
  applyLanguageSnapshot,
  fetchEntityForLanguage,
  resolveMainDocument,
  resolvePlaintext,
  syncLoaderLanguage,
  type ApplyLanguageResult,
  type LanguageSnapshotSetters,
} from '../entityLanguageUtils.js';

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
  const applyGenerationRef = useRef(0);
  return useCallback(
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
      const nextPlaintext = await resolvePlaintext(nextMainDocument);
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
    [loaderEntity, defaultLanguage, setters]
  );
};

const useLoaderLanguageSync = ({
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
  const prevLoaderLanguageRef = useRef(loaderLanguage);
  useEffect(() => {
    const loaderLanguageChanged = prevLoaderLanguageRef.current !== loaderLanguage;
    prevLoaderLanguageRef.current = loaderLanguage;
    return syncLoaderLanguage({
      loaderEntity,
      loaderLanguage,
      loaderLanguageChanged,
      initialMainDocument,
      initialPagePlaintext,
      languageRef,
      isLoadingRef,
      setMainDocument,
      setPagePlaintext,
      applyLanguage,
      fallbackToLoader,
    });
  }, [
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
  ]);
};

const useSyncPagePlaintext = ({
  mainDocument,
  setPagePlaintext,
}: {
  mainDocument?: FileType;
  setPagePlaintext: (text: string | undefined) => void;
}) => {
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get(PAGE_PARAM) || '1';
  const isRawView = searchParams.get(VIEW_MODE_PARAM) === 'true';

  useEffect(() => {
    let cancelled = false;
    if (!isRawView || !mainDocument?._id) {
      setPagePlaintext(undefined);
      return () => {
        cancelled = true;
      };
    }

    setPagePlaintext(entityLoaderCache.getPlaintext(mainDocument._id, Number(pageParam)));
    resolvePlaintext(mainDocument)
      .then(text => {
        if (!cancelled) setPagePlaintext(text);
      })
      .catch(() => {
        if (!cancelled) setPagePlaintext(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [mainDocument, pageParam, isRawView, setPagePlaintext]);
};

// eslint-disable-next-line max-statements
const useEntityLanguageState = ({
  loaderEntity,
  initialLanguage,
  initialMainDocument,
  initialPagePlaintext,
  defaultLanguage,
  setEntity,
}: UseEntityLanguageStateParams) => {
  const loaderLanguage = loaderEntity.language || initialLanguage;
  const [language, setLanguageState] = useState(initialLanguage);
  const [mainDocument, setMainDocument] = useState(initialMainDocument);
  const [pagePlaintext, setPagePlaintext] = useState(initialPagePlaintext);
  const [isLoading, setIsLoading] = useState(false);
  const languageRef = useRef(language);
  const isLoadingRef = useRef(isLoading);
  languageRef.current = language;
  isLoadingRef.current = isLoading;

  const setters: LanguageSnapshotSetters = useMemo(
    () => ({ setLanguageState, setEntity, setMainDocument, setPagePlaintext }),
    [setEntity]
  );
  const applyLanguage = useApplyLanguage(loaderEntity, defaultLanguage, setters);
  const fallbackToLoader = useCallback(() => {
    applyLanguageSnapshot(
      {
        language: loaderLanguage,
        entity: loaderEntity,
        mainDocument: initialMainDocument,
        pagePlaintext: initialPagePlaintext,
      },
      setters
    );
  }, [loaderLanguage, loaderEntity, initialMainDocument, initialPagePlaintext, setters]);
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
    [applyLanguage]
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
  });
  useSyncPagePlaintext({ mainDocument, setPagePlaintext });

  return { language, mainDocument, pagePlaintext, isLoading, setLanguage };
};

export { useEntityLanguageState };
export type { ApplyLanguageResult };
