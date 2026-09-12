import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { settingsAtom } from '#V2/atoms/index.js';
import { convertTextSelectionToTocEntry } from '#V2/Routes/Entity/Components/ToC/index.js';
import {
  useDocumentPdf,
  useMetadataEditing,
  useRelationshipsActions,
  useTocActions,
  useEntityWriteAuthorized,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityTabNavigation } from '../EntityTabsContext.js';
import { SIDE_TAB } from '../tabIds.js';

function usePdfTextSelection() {
  const {
    documentPdfSelection: selectedText,
    pdfSelectionMenuOpen,
    setDocumentPdfSelection: setSelectedText,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();
  const { isEditing } = useMetadataEditing();

  const handleTextSelect = useCallback(
    (selection: TextSelection) => {
      if (selection.selectionRectangles && selection.selectionRectangles.length > 0) {
        setSelectedText(selection);
        setPdfSelectionMenuOpen(true);
      } else {
        setSelectedText(undefined);
        setPdfSelectionMenuOpen(false);
      }
    },
    [setPdfSelectionMenuOpen, setSelectedText]
  );

  const handleTextDeselect = useCallback(() => {
    setPdfSelectionMenuOpen(false);
    if (!isEditing) {
      setSelectedText(undefined);
    }
  }, [isEditing, setPdfSelectionMenuOpen, setSelectedText]);

  return { selectedText, pdfSelectionMenuOpen, handleTextSelect, handleTextDeselect };
}

function useDocumentPdfTextHandlers() {
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const canWrite = useEntityWriteAuthorized();
  const pdfSelection = usePdfTextSelection();
  const { addEntry } = useTocActions();
  const { openCreateRelationship } = useRelationshipsActions();
  const { focusRelationshipsPanel, focusSideTab } = useEntityTabNavigation();

  const handleCreateRelationship = useCallback(
    (selection: TextSelection) => {
      openCreateRelationship(selection);
      focusRelationshipsPanel();
    },
    [focusRelationshipsPanel, openCreateRelationship]
  );

  const handleAddToToC = useCallback(
    (selection: TextSelection) => {
      addEntry(convertTextSelectionToTocEntry(selection));
      focusSideTab(SIDE_TAB.TOC);
    },
    [addEntry, focusSideTab]
  );

  return {
    canWrite,
    ocrServiceEnabled,
    ...pdfSelection,
    handleCreateRelationship,
    handleAddToToC,
  };
}

export { useDocumentPdfTextHandlers };
