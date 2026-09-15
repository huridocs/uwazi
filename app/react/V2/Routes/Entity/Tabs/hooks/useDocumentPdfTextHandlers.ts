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

const usePdfTextSelection = () => {
  const {
    documentPdfSelection: selectedText,
    pdfSelectionMenuOpen,
    setDocumentPdfSelection: setSelectedText,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();
  const { isEditing } = useMetadataEditing();

  const handleTextSelect = useCallback(
    (selection: TextSelection) => {
      const hasRects = Boolean(selection.selectionRectangles?.length);
      setSelectedText(hasRects ? selection : undefined);
      setPdfSelectionMenuOpen(hasRects);
    },
    [setPdfSelectionMenuOpen, setSelectedText]
  );

  const handleTextDeselect = useCallback(() => {
    setPdfSelectionMenuOpen(false);
    if (!isEditing) setSelectedText(undefined);
  }, [isEditing, setPdfSelectionMenuOpen, setSelectedText]);

  return { selectedText, pdfSelectionMenuOpen, handleTextSelect, handleTextDeselect };
};

const usePdfTextNavigation = () => {
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

  return { handleCreateRelationship, handleAddToToC };
};

const useDocumentPdfTextHandlers = () => {
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const canWrite = useEntityWriteAuthorized();
  const selection = usePdfTextSelection();
  const navigation = usePdfTextNavigation();
  return { canWrite, ocrServiceEnabled, ...selection, ...navigation };
};

export { useDocumentPdfTextHandlers };
