import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { convertTextSelectionToTocEntry } from '#V2/Routes/Entity/Components/ToC/index.js';
import {
  useDocumentPdf,
  useRelationshipsActions,
  useTocActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { SIDE_TAB_PARAM } from '../../urlParams.js';
import { SIDE_TAB } from '../tabIds.js';
import { useEntityTabNavigation } from './useEntityTabNavigation.js';

function useDocumentPdfTextHandlers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [userIsAdminOrEditor, setUserIsAdminOrEditor] = useState(false);
  const { documentPdfSelection: selectedText, setDocumentPdfSelection: setSelectedText } =
    useDocumentPdf();
  const { addEntry } = useTocActions();
  const { openCreateRelationship } = useRelationshipsActions();
  const { focusRelationshipsPanel } = useEntityTabNavigation();
  const { selectTab: selectSideTab } = useTabGroup('entity-side');

  useEffect(() => {
    setUserIsAdminOrEditor((user?._id && ['admin', 'editor'].includes(user.role)) || false);
  }, [user]);

  useEffect(
    () => () => {
      setSelectedText(undefined);
    },
    [setSelectedText]
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
      selectSideTab(SIDE_TAB.TOC);
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, SIDE_TAB.TOC);
      setSearchParams(next, { replace: true });
    },
    [addEntry, searchParams, selectSideTab, setSearchParams]
  );

  return {
    selectedText,
    userIsAdminOrEditor,
    ocrServiceEnabled,
    handleTextSelect,
    handleTextDeselect,
    handleCreateRelationship,
    handleAddToToC,
  };
}

export { useDocumentPdfTextHandlers };
