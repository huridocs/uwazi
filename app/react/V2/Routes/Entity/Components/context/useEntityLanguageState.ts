import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '#app/I18N/index.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  applyLanguageSnapshot,
  fetchEntityForLanguage,
  resolveMainDocument,
  resolvePlaintext,
  seedLoaderCache,
  type LanguageSnapshotSetters,
} from './entityLanguageUtils.js';
import { useSyncPagePlaintext } from './useSyncPagePlaintext.js';

type ApplyLanguageResult = 'applied' | 'stale' | 'failed';

type UseEntityLanguageStateParams = {
  loaderEntity: Entity;
  initialLanguage: string;
  initialMainDocument?: FileType;
  initialPagePlaintext?: string;
  defaultLanguage?: string;
  setEntity: (entity: Entity) => void;
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
  const [language, setLanguageState] = useState(initialLanguage);
  const [mainDocument, setMainDocument] = useState(initialMainDocument);
  const [pagePlaintext, setPagePlaintext] = useState(initialPagePlaintext);
  const [isLoading, setIsLoading] = useState(false);

  const languageRef = useRef(language);
  languageRef.current = language;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const applyGenerationRef = useRef(0);

  const setters: LanguageSnapshotSetters = useMemo(
    () => ({ setLanguageState, setEntity, setMainDocument, setPagePlaintext }),
    [setEntity]
  );

  const applyLanguage = useCallback(
    // eslint-disable-next-line max-statements
    async (nextLanguage: string): Promise<ApplyLanguageResult> => {
      const { sharedId } = loaderEntity;
      if (!sharedId) {
        return 'failed';
      }

      applyGenerationRef.current += 1;
      const generation = applyGenerationRef.current;
      const isCurrent = () => generation === applyGenerationRef.current;
      const nextEntity = await fetchEntityForLanguage(sharedId, nextLanguage);
      if (!isCurrent()) {
        return 'stale';
      }
      if (!nextEntity) {
        return 'failed';
      }

      const nextMainDocument = resolveMainDocument(
        sharedId,
        nextLanguage,
        nextEntity.documents,
        defaultLanguage
      );
      const nextPlaintext = await resolvePlaintext(nextMainDocument);
      if (!isCurrent()) {
        return 'stale';
      }

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
      if (nextLanguage === languageRef.current || isLoadingRef.current) {
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
    [applyLanguage]
  );

  useEffect(() => {
    seedLoaderCache(loaderEntity, loaderLanguage, initialMainDocument);

    if (loaderLanguage === languageRef.current) {
      setMainDocument(initialMainDocument);
      return undefined;
    }

    if (isLoadingRef.current) {
      return undefined;
    }

    let cancelled = false;
    applyLanguage(languageRef.current)
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
  }, [loaderEntity, loaderLanguage, initialMainDocument, applyLanguage, fallbackToLoader]);

  useSyncPagePlaintext({
    loaderLanguage,
    uiLanguage: language,
    initialPagePlaintext,
    mainDocument,
    setPagePlaintext,
  });

  return { language, mainDocument, pagePlaintext, isLoading, setLanguage };
};

export { useEntityLanguageState };
export type { ApplyLanguageResult };
