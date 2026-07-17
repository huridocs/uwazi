import { useEffect, useRef, type MutableRefObject } from 'react';
import { useSearchParams } from 'react-router';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../../urlParams.js';
import { useMetadataEditing } from '../MetadataEditingContext.js';
import {
  resolvePlaintext,
  resolveSyncMode,
  syncLoaderLanguage,
  type ApplyLanguageResult,
} from '../entityLanguageUtils.js';

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
  invalidateApply,
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
  invalidateApply: () => void;
}) => {
  const { isDirty, isSaving, isEditing, cancelEdit } = useMetadataEditing();
  const prevLoaderLanguageRef = useRef(loaderLanguage);
  const pendingAdoptRef = useRef(false);

  useEffect(() => {
    const loaderLanguageChanged = prevLoaderLanguageRef.current !== loaderLanguage;
    prevLoaderLanguageRef.current = loaderLanguage;
    const { mode, pendingAdopt } = resolveSyncMode({
      loaderLanguageChanged,
      pendingAdopt: pendingAdoptRef.current,
      preserveUiLanguage: isDirty || isSaving,
      loaderLanguage,
      uiLanguage: languageRef.current,
    });
    pendingAdoptRef.current = pendingAdopt;

    if (mode === 'adopt-loader') {
      if (isEditing) {
        cancelEdit();
      }
      invalidateApply();
    }

    return syncLoaderLanguage({
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
    invalidateApply,
    isDirty,
    isSaving,
    isEditing,
    cancelEdit,
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

export { useLoaderLanguageSync, useSyncPagePlaintext };
