import { useCallback, useEffect, useRef, useState } from 'react';
import { isClient } from '#app/utils/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useEntityHashParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';

type UseDocumentPdfPageParams = {
  mainDocument: FileType;
  mainPdfController: PDFControls | null | undefined;
  setPdfController: (controls: PDFControls | null) => void;
};

function useDocumentPdfPage({
  mainDocument,
  mainPdfController,
  setPdfController,
}: UseDocumentPdfPageParams) {
  const hashParams = useEntityHashParams();
  const updateEntityUrl = useUpdateEntityUrl();
  const [ready, setReady] = useState(false);
  const page = hashParams.get(PAGE_PARAM) || '1';
  const pageNumber = Number.parseInt(page || '1', 10);
  const targetPageRef = useRef(pageNumber);
  const pageSyncEnabledRef = useRef(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const documentIdRef = useRef(mainDocument._id);
  const isRaw = !isClient || !ready || hashParams.get(VIEW_MODE_PARAM) === 'true';

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(
    () => () => {
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (pageSyncEnabledRef.current) {
      targetPageRef.current = pageNumber;
    }
  }, [pageNumber]);

  useEffect(() => {
    if (documentIdRef.current === mainDocument._id) {
      return;
    }
    documentIdRef.current = mainDocument._id;
    targetPageRef.current = 1;
    pageSyncEnabledRef.current = false;
    setPdfController(null);
    if (hashParams.get(PAGE_PARAM) === '1' || !hashParams.get(PAGE_PARAM)) {
      return;
    }
    updateEntityUrl({
      hash: next => {
        next.set(PAGE_PARAM, '1');
      },
    });
  }, [mainDocument._id, hashParams, setPdfController, updateEntityUrl]);

  const updatePageParam = useCallback(
    (pageParam: number | string) => {
      updateEntityUrl({
        hash: next => {
          next.set(PAGE_PARAM, String(pageParam));
        },
      });
    },
    [updateEntityUrl]
  );

  const handlePageNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      if (isRaw) {
        return;
      }
      const targetPage =
        direction === 'prev'
          ? Math.max(1, pageNumber - 1)
          : Math.min(pageNumber + 1, mainDocument?.totalPages || 0);
      targetPageRef.current = targetPage;
      pageSyncEnabledRef.current = true;
      updatePageParam(targetPage);
      mainPdfController?.goToPage(targetPage);
    },
    [mainDocument?.totalPages, isRaw, pageNumber, updatePageParam, mainPdfController]
  );

  const handlePageChange = useCallback(
    (newPageNumber: number) => {
      if (!pageSyncEnabledRef.current) {
        // Unlock once the restored page is visible; ignore earlier intersection noise.
        if (newPageNumber === targetPageRef.current) {
          pageSyncEnabledRef.current = true;
          if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
        }
        return;
      }
      if (newPageNumber !== targetPageRef.current) {
        targetPageRef.current = newPageNumber;
        updatePageParam(newPageNumber);
      }
    },
    [updatePageParam]
  );

  const onPdfReady = useCallback(
    (controls: PDFControls) => {
      const targetPage = targetPageRef.current || 1;
      setPdfController(controls);
      if (targetPage === 1) {
        pageSyncEnabledRef.current = true;
        return;
      }
      controls.goToPage(targetPage);
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = setTimeout(() => {
        pageSyncEnabledRef.current = true;
      }, 400);
    },
    [setPdfController]
  );

  const { filename, totalPages } = mainDocument || {
    filename: '',
    totalPages: 0,
  };
  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(pageNumber + 1, totalPages || 0);

  return {
    filename,
    totalPages,
    pageNumber,
    prevPage,
    nextPage,
    isRaw,
    handlePageNavigation,
    handlePageChange,
    onPdfReady,
  };
}

export { useDocumentPdfPage };
