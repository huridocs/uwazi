import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { isClient } from '#app/utils/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { PAGE_PARAM, SIDE_TAB_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';
import { useTocActions, convertTextSelectionToTocEntry } from '../../Components/ToC/tocAtom.js';
import { useRelationshipsActions } from '../../Components/RelationshipsPanel/relationshipsAtom.js';
import {
  documentPdfSelectionAtom,
  pdfController,
  scrollToRelationshipPanelAtom,
} from '../../Components/atoms.js';
import { relationshipsPanelActiveClusterRefIdsAtom } from '../../Components/RelationshipsPanel/relationshipsPanelFiltersAtom.js';
import { useRelationshipSelection } from '../../Components/useRelationshipSelection.js';
import { SIDE_TAB } from '../tabIds.js';

type UseDocumentPdfViewParams = {
  mainDocument: FileType;
  entity?: EntityType;
};

const useDocumentPdfView = ({ mainDocument, entity }: UseDocumentPdfViewParams) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [userIsAdminOrEditor, setUserIsAdminOrEditor] = useState(false);
  const mainPdfController = useAtomValue(pdfController);
  const setPDFControlsAtom = useSetAtom(pdfController);
  const [selectedText, setSelectedText] = useAtom(documentPdfSelectionAtom);
  const setScrollToRelationshipPanel = useSetAtom(scrollToRelationshipPanelAtom);
  const [activeClusterRefIds, setActiveClusterRefIds] = useAtom(
    relationshipsPanelActiveClusterRefIdsAtom
  );
  const { activeRelationshipId, selectRelationship } = useRelationshipSelection();
  const { addEntry } = useTocActions();
  const { setCreateReferenceSelection } = useRelationshipsActions();

  useEffect(() => {
    setUserIsAdminOrEditor((user?._id && ['admin', 'editor'].includes(user.role)) || false);
  }, [user]);

  useEffect(
    () => () => {
      setSelectedText(undefined);
    },
    [setSelectedText]
  );

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
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const openRelationshipsSideTab = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set(SIDE_TAB_PARAM, SIDE_TAB.RELATIONSHIPS);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, setSearchParams]);

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
      next.set(SIDE_TAB_PARAM, SIDE_TAB.RELATIONSHIPS);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleConnectToDocument = useCallback(
    (selection: TextSelection) => {
      setCreateReferenceSelection(selection, 'entity');
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, SIDE_TAB.RELATIONSHIPS);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleAddToToC = useCallback(
    (selection: TextSelection) => {
      // Selection is already in scale=1 (normalized) from PDF onSelect
      const tocEntry = convertTextSelectionToTocEntry(selection);
      addEntry(tocEntry);
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, SIDE_TAB.TOC);
      setSearchParams(next, { replace: true });
    },
    [addEntry, searchParams, setSearchParams]
  );

  const handleRemove = useCallback((_selection: TextSelection) => {
    // TODO: Implement remove functionality
  }, []);

  const handleRailPointClick = useCallback(
    (marker: RelationshipMarker) => {
      if (!entity) return;
      openRelationshipsSideTab();
      selectRelationship(marker, { scrollPanel: true });
    },
    [entity, openRelationshipsSideTab, selectRelationship]
  );

  const handleClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
      if (!entity || markers.length === 0) return;
      const clusterPage = markers[0]?.anchor?.selections?.[0]?.page;
      if (!clusterPage) return;

      const ids = markers.map(marker => marker._id);
      const isSameCluster =
        activeClusterRefIds !== null &&
        activeClusterRefIds.length === ids.length &&
        ids.every(id => activeClusterRefIds.includes(id));

      if (isSameCluster) {
        setActiveClusterRefIds(null);
        return;
      }

      setActiveClusterRefIds(ids);
      openRelationshipsSideTab();
      mainPdfController?.goToPage(clusterPage);
    },
    [
      activeClusterRefIds,
      entity,
      mainPdfController,
      openRelationshipsSideTab,
      setActiveClusterRefIds,
    ]
  );

  useEffect(
    () => () => {
      setActiveClusterRefIds(null);
    },
    [entity?.sharedId, setActiveClusterRefIds]
  );

  const handleHighlightClick = useCallback(
    (relationshipId: string) => {
      openRelationshipsSideTab();
      setScrollToRelationshipPanel(relationshipId);
    },
    [openRelationshipsSideTab, setScrollToRelationshipPanel]
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
    entity,
    activeRelationshipId,
    getPageSearchParams,
    handleTextSelect,
    handleTextDeselect,
    handleConnectToParagraph,
    handleConnectToDocument,
    handleAddToToC,
    handleRemove,
    handlePageNavigation,
    handlePageChange,
    handleRailPointClick,
    handleClusterClick,
    handleHighlightClick,
    onPdfReady,
  };
};

export { useDocumentPdfView };
