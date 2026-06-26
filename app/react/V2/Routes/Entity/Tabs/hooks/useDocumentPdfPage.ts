import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { isClient } from '#app/utils/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';

type UseDocumentPdfPageParams = {
  mainDocument: FileType;
  mainPdfController: PDFControls | null | undefined;
  setPdfController: (controls: PDFControls) => void;
};

function useDocumentPdfPage({
  mainDocument,
  mainPdfController,
  setPdfController,
}: UseDocumentPdfPageParams) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get(PAGE_PARAM) || '1';
  const pageNumber = Number.parseInt(page || '1', 10);
  const initialPage = useRef<number>(pageNumber);
  const isRaw = !isClient || searchParams.get(VIEW_MODE_PARAM) === 'true';

  const getPageSearchParams = useCallback(
    (pageParam: number | string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      return next;
    },
    [searchParams]
  );

  const updatePageParam = useCallback(
    (pageParam: number | string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set(PAGE_PARAM, String(pageParam));
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [setSearchParams]
  );

  const handlePageNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      const targetPage =
        direction === 'prev'
          ? Math.max(1, pageNumber - 1)
          : Math.min(pageNumber + 1, mainDocument?.totalPages || 0);
      if (isRaw) {
        updatePageParam(targetPage);
      } else if (mainPdfController) {
        updatePageParam(targetPage);
        mainPdfController.goToPage(targetPage);
      } else {
        updatePageParam(targetPage);
      }
    },
    [mainDocument?.totalPages, isRaw, pageNumber, updatePageParam, mainPdfController]
  );

  const handlePageChange = useCallback(
    (newPageNumber: number) => {
      if (newPageNumber !== initialPage.current) {
        initialPage.current = newPageNumber;
        updatePageParam(newPageNumber);
      }
    },
    [updatePageParam]
  );

  const onPdfReady = useCallback(
    (controls: PDFControls) => {
      const targetPage = initialPage.current || 1;
      setPdfController(controls);
      if (targetPage !== 1) {
        controls.goToPage(targetPage);
      }
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
    getPageSearchParams,
    handlePageNavigation,
    handlePageChange,
    onPdfReady,
  };
}

export { useDocumentPdfPage };
