import { useState, useEffect, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { convertTextSelectionToTocEntry } from '#V2/Routes/Entity/Components/ToC/index.js';
import {
  useDocumentPdf,
  useMetadataEditing,
  useRelationshipsActions,
  useTocActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityTabNavigation } from '../EntityTabsContext.js';
import { SIDE_TAB } from '../tabIds.js';

function useDocumentPdfTextHandlers() {
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [userIsAdminOrEditor, setUserIsAdminOrEditor] = useState(false);
  const {
    documentPdfSelection: selectedText,
    pdfSelectionMenuOpen,
    setDocumentPdfSelection: setSelectedText,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();
  const { isEditing } = useMetadataEditing();
  const { addEntry } = useTocActions();
  const { openCreateRelationship } = useRelationshipsActions();
  const { focusRelationshipsPanel, focusSideTab } = useEntityTabNavigation();

  useEffect(() => {
    setUserIsAdminOrEditor((user?._id && ['admin', 'editor'].includes(user.role)) || false);
  }, [user]);

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

  const handleCreateRelationship = useCallback(
    (selection: TextSelection) => {
      openCreateRelationship(selection);
      focusRelationshipsPanel();
    },
    [focusRelationshipsPanel, openCreateRelationship]
  );

  const handleAddToToC = useCallback(
    (selection: TextSelection) => {
      const tocEntry = convertTextSelectionToTocEntry(selection);
      addEntry(tocEntry);
      focusSideTab(SIDE_TAB.TOC);
    },
    [addEntry, focusSideTab]
  );

  return {
    selectedText,
    pdfSelectionMenuOpen,
    userIsAdminOrEditor,
    ocrServiceEnabled,
    handleTextSelect,
    handleTextDeselect,
    handleCreateRelationship,
    handleAddToToC,
  };
}

export { useDocumentPdfTextHandlers };
