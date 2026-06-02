import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { isClient } from '#app/utils/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { PAGE_PARAM, SIDE_TAB_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';
import { useTocActions, convertTextSelectionToTocEntry } from '../../Components/ToC/tocAtom.js';
import { useReferencesActions } from '../../Components/ReferencesPanel/referencesAtom.js';
import { documentPdfSelectionAtom, pdfController } from '../../Components/atoms.js';

type UseDocumentPdfViewParams = {
  mainDocument: FileType;
};

const useDocumentPdfView = ({ mainDocument }: UseDocumentPdfViewParams) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [hydrated, setHydrated] = useState(false);
  const [userIsAdminOrEditor, setUserIsAdminOrEditor] = useState(false);
  const mainPdfController = useAtomValue(pdfController);
  const setPDFControlsAtom = useSetAtom(pdfController);
  const [selectedText, setSelectedText] = useAtom(documentPdfSelectionAtom);
  const { addEntry } = useTocActions();
  const { setCreateReferenceSelection } = useReferencesActions();

  useEffect(() => {
    setUserIsAdminOrEditor((user?._id && ['admin', 'editor'].includes(user.role)) || false);
  }, [user]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(
    () => () => {
      setSelectedText(undefined);
    },
    [setSelectedText]
  );

  const page = searchParams.get(PAGE_PARAM) || '1';
  const pageNumber = Number.parseInt(page || '1', 10);
  const initialPage = useRef<number>(pageNumber);
  const isRaw = !isClient || !hydrated || searchParams.get(VIEW_MODE_PARAM) === 'true';

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
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const handleTextSelect = useCallback(
    (selection: TextSelection) => {
      if (selection.selectionRectangles && selection.selectionRectangles.length > 0) {
        setSelectedText(selection);
      } else {
        setSelectedText(undefined);
      }
    },
    [setSelectedText]
  );

  const handleTextDeselect = useCallback(() => {
    setSelectedText(undefined);
  }, [setSelectedText]);

  const handleConnectToParagraph = useCallback(
    (selection: TextSelection) => {
      setCreateReferenceSelection(selection, 'text');
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'references');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleConnectToDocument = useCallback(
    (selection: TextSelection) => {
      setCreateReferenceSelection(selection, 'entity');
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'references');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleAddToToC = useCallback(
    (selection: TextSelection) => {
      const tocEntry = convertTextSelectionToTocEntry(selection);
      addEntry(tocEntry);
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'toc');
      setSearchParams(next, { replace: true });
    },
    [addEntry, searchParams, setSearchParams]
  );

  const handleRemove = useCallback((_selection: TextSelection) => {
    // TODO: Implement remove functionality
  }, []);

  const handlePageNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      const targetPage =
        direction === 'prev'
          ? Math.max(1, pageNumber - 1)
          : Math.min(pageNumber + 1, mainDocument?.totalPages || 0);
      if (isRaw) {
        updatePageParam(targetPage);
      } else if (mainPdfController) {
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
      setPDFControlsAtom(controls);
      if (targetPage !== 1) {
        controls.goToPage(targetPage);
      }
    },
    [setPDFControlsAtom]
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
    selectedText,
    userIsAdminOrEditor,
    ocrServiceEnabled,
    mainDocument,
    getPageSearchParams,
    handleTextSelect,
    handleTextDeselect,
    handleConnectToParagraph,
    handleConnectToDocument,
    handleAddToToC,
    handleRemove,
    handlePageNavigation,
    handlePageChange,
    onPdfReady,
  };
};

export { useDocumentPdfView };
