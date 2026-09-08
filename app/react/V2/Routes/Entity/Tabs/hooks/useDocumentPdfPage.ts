import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useStore } from 'jotai';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import {
  useEntityDocumentPage,
  useEntityRawView,
  useUpdateEntityUrl,
} from '#V2/Routes/Entity/entityUrlState.js';
import { useSsrOnlyContent } from '#V2/Routes/Entity/Components/relationships/hooks/useSsrOnlyContent.js';
import { entityPageAtom } from '../../entityUrlAtoms.js';
import { PAGE_PARAM } from '../../urlParams.js';
import { usePdfPageParam } from './usePdfPageParam.js';

type UseDocumentPdfPageParams = {
  mainDocument: FileType;
  mainPdfController: PDFControls | null | undefined;
  setPdfController: (controls: PDFControls | null) => void;
};

const useResetPdfOnDocumentChange = ({
  mainDocumentId,
  setPdfController,
  documentIdRef,
  targetPageRef,
  pageSyncEnabledRef,
  pendingVisiblePageRef,
  ownedControllerRef,
  store,
  updateEntityUrl,
}: {
  mainDocumentId: string | undefined;
  setPdfController: (controls: PDFControls | null) => void;
  documentIdRef: MutableRefObject<string | undefined>;
  targetPageRef: MutableRefObject<number>;
  pageSyncEnabledRef: MutableRefObject<boolean>;
  pendingVisiblePageRef: MutableRefObject<number>;
  ownedControllerRef: MutableRefObject<PDFControls | null>;
  store: ReturnType<typeof useStore>;
  updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>;
}) => {
  useEffect(() => {
    if (documentIdRef.current === mainDocumentId) {
      return;
    }
    documentIdRef.current = mainDocumentId;
    targetPageRef.current = 1;
    pageSyncEnabledRef.current = false;
    pendingVisiblePageRef.current = 0;
    ownedControllerRef.current = null;
    setPdfController(null);
    if (store.get(entityPageAtom) !== '1') {
      updateEntityUrl({
        hash: next => {
          next.set(PAGE_PARAM, '1');
        },
      });
    }
  }, [
    documentIdRef,
    mainDocumentId,
    ownedControllerRef,
    pageSyncEnabledRef,
    pendingVisiblePageRef,
    setPdfController,
    store,
    targetPageRef,
    updateEntityUrl,
  ]);
};

const usePdfPageHandlers = ({
  isRaw,
  pageNumber,
  totalPages,
  mainPdfController,
  targetPageRef,
  pageSyncEnabledRef,
  pendingVisiblePageRef,
  ownedControllerRef,
  unlockTimeoutRef,
  setPdfController,
  updatePageParam,
}: {
  isRaw: boolean;
  pageNumber: number;
  totalPages: number | undefined;
  mainPdfController: PDFControls | null | undefined;
  targetPageRef: MutableRefObject<number>;
  pageSyncEnabledRef: MutableRefObject<boolean>;
  pendingVisiblePageRef: MutableRefObject<number>;
  ownedControllerRef: MutableRefObject<PDFControls | null>;
  unlockTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  setPdfController: (controls: PDFControls | null) => void;
  updatePageParam: (pageParam: number | string) => void;
}) => {
  const unlockPageSync = useCallback(() => {
    pageSyncEnabledRef.current = true;
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = undefined;
    }
    const pending = pendingVisiblePageRef.current;
    if (pending > 0 && pending !== targetPageRef.current) {
      targetPageRef.current = pending;
      updatePageParam(pending);
    }
  }, [pageSyncEnabledRef, pendingVisiblePageRef, targetPageRef, unlockTimeoutRef, updatePageParam]);

  const handlePageNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      if (isRaw) {
        return;
      }
      const targetPage =
        direction === 'prev'
          ? Math.max(1, pageNumber - 1)
          : Math.min(pageNumber + 1, totalPages || 0);
      targetPageRef.current = targetPage;
      pageSyncEnabledRef.current = true;
      updatePageParam(targetPage);
      mainPdfController?.goToPage(targetPage);
    },
    [
      isRaw,
      mainPdfController,
      pageNumber,
      pageSyncEnabledRef,
      targetPageRef,
      totalPages,
      updatePageParam,
    ]
  );

  const handlePageChange = useCallback(
    (newPageNumber: number) => {
      if (!pageSyncEnabledRef.current) {
        pendingVisiblePageRef.current = newPageNumber;
        if (newPageNumber === targetPageRef.current) {
          unlockPageSync();
        }
        return;
      }
      if (newPageNumber !== targetPageRef.current) {
        targetPageRef.current = newPageNumber;
        updatePageParam(newPageNumber);
      }
    },
    [pageSyncEnabledRef, pendingVisiblePageRef, targetPageRef, unlockPageSync, updatePageParam]
  );

  const onPdfReady = useCallback(
    (controls: PDFControls) => {
      const targetPage = targetPageRef.current || 1;
      ownedControllerRef.current = controls;
      setPdfController(controls);
      if (targetPage === 1) {
        unlockPageSync();
        return;
      }
      controls.goToPage(targetPage);
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = setTimeout(() => {
        unlockPageSync();
      }, 400);
    },
    [ownedControllerRef, setPdfController, targetPageRef, unlockPageSync, unlockTimeoutRef]
  );

  return { handlePageNavigation, handlePageChange, onPdfReady };
};

const usePdfPageRefs = (
  pageNumber: number,
  documentId: string | undefined,
  mainPdfController: PDFControls | null | undefined
) => {
  const targetPageRef = useRef(pageNumber);
  const pageSyncEnabledRef = useRef(false);
  const pendingVisiblePageRef = useRef(0);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const documentIdRef = useRef(documentId);
  const ownedControllerRef = useRef<PDFControls | null>(null);
  const mainPdfControllerRef = useRef(mainPdfController);
  mainPdfControllerRef.current = mainPdfController;
  return {
    targetPageRef,
    pageSyncEnabledRef,
    pendingVisiblePageRef,
    unlockTimeoutRef,
    documentIdRef,
    ownedControllerRef,
    mainPdfControllerRef,
  };
};

type PdfPageRuntimeArgs = {
  isRaw: boolean;
  pageNumber: number;
  mainDocument: FileType;
  mainPdfController: PDFControls | null | undefined;
  setPdfController: (controls: PDFControls | null) => void;
  refs: ReturnType<typeof usePdfPageRefs>;
  store: ReturnType<typeof useStore>;
  updateEntityUrl: ReturnType<typeof useUpdateEntityUrl>;
  updatePageParam: (pageParam: number | string) => void;
};

const usePdfPageRuntime = (args: PdfPageRuntimeArgs) => {
  const { isRaw, pageNumber, mainDocument, mainPdfController, setPdfController, refs } = args;
  const { store, updateEntityUrl, updatePageParam } = args;
  const {
    targetPageRef,
    pageSyncEnabledRef,
    pendingVisiblePageRef,
    unlockTimeoutRef,
    documentIdRef,
    ownedControllerRef,
    mainPdfControllerRef,
  } = refs;
  useEffect(
    () => () => {
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
      if (mainPdfControllerRef.current === ownedControllerRef.current) {
        setPdfController(null);
      }
      ownedControllerRef.current = null;
    },
    [mainPdfControllerRef, ownedControllerRef, setPdfController, unlockTimeoutRef]
  );
  useEffect(() => {
    if (pageSyncEnabledRef.current) {
      targetPageRef.current = pageNumber;
    }
  }, [pageNumber, pageSyncEnabledRef, targetPageRef]);
  useResetPdfOnDocumentChange({
    mainDocumentId: mainDocument._id,
    setPdfController,
    documentIdRef,
    targetPageRef,
    pageSyncEnabledRef,
    pendingVisiblePageRef,
    ownedControllerRef,
    store,
    updateEntityUrl,
  });
  return usePdfPageHandlers({
    isRaw,
    pageNumber,
    totalPages: mainDocument?.totalPages,
    mainPdfController,
    targetPageRef,
    pageSyncEnabledRef,
    pendingVisiblePageRef,
    ownedControllerRef,
    unlockTimeoutRef,
    setPdfController,
    updatePageParam,
  });
};

function useDocumentPdfPage({
  mainDocument,
  mainPdfController,
  setPdfController,
}: UseDocumentPdfPageParams) {
  const pageNumber = useEntityDocumentPage();
  const isRaw = [useSsrOnlyContent(), useEntityRawView()].some(Boolean);
  const { store, updateEntityUrl, updatePageParam } = usePdfPageParam();
  const refs = usePdfPageRefs(pageNumber, mainDocument._id, mainPdfController);
  const { handlePageNavigation, handlePageChange, onPdfReady } = usePdfPageRuntime({
    isRaw,
    pageNumber,
    mainDocument,
    mainPdfController,
    setPdfController,
    refs,
    store,
    updateEntityUrl,
    updatePageParam,
  });
  const { filename, totalPages } = mainDocument || { filename: '', totalPages: 0 };
  return {
    filename,
    totalPages,
    pageNumber,
    prevPage: Math.max(1, pageNumber - 1),
    nextPage: Math.min(pageNumber + 1, totalPages || 0),
    isRaw,
    handlePageNavigation,
    handlePageChange,
    onPdfReady,
  };
}

export { useDocumentPdfPage };
