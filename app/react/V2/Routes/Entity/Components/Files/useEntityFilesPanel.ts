import { useCallback, useState } from 'react';
import { FileEditFocus } from './types.js';

type FilePanelMode = 'details' | 'preview';

const useFilePanelState = () => {
  const [focusedRowId, setFocusedRowId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<FileEditFocus>('name');
  const [filePanelMode, setFilePanelMode] = useState<FilePanelMode>('details');
  return {
    focusedRowId,
    setFocusedRowId,
    isEditing,
    setIsEditing,
    editFocus,
    setEditFocus,
    filePanelMode,
    setFilePanelMode,
  };
};

const useEntityFilesPanel = () => {
  const {
    focusedRowId,
    setFocusedRowId,
    isEditing,
    setIsEditing,
    editFocus,
    setEditFocus,
    filePanelMode,
    setFilePanelMode,
  } = useFilePanelState();

  const setFocusedRow = useCallback(
    (rowId: string) => {
      setFocusedRowId(rowId);
      setIsEditing(false);
      setEditFocus('name');
      setFilePanelMode('details');
    },
    [setEditFocus, setFilePanelMode, setFocusedRowId, setIsEditing]
  );

  const openFilePreview = useCallback(() => {
    setIsEditing(false);
    setFilePanelMode('preview');
  }, [setFilePanelMode, setIsEditing]);

  const openFilePreviewForRow = useCallback(
    (rowId: string) => {
      setFocusedRowId(rowId);
      setIsEditing(false);
      setEditFocus('name');
      setFilePanelMode('preview');
    },
    [setEditFocus, setFilePanelMode, setFocusedRowId, setIsEditing]
  );

  const openFileEdit = useCallback(
    (rowId: string, focus: FileEditFocus = 'name') => {
      setFocusedRowId(rowId);
      setFilePanelMode('details');
      setEditFocus(focus);
      setIsEditing(true);
    },
    [setEditFocus, setFilePanelMode, setFocusedRowId, setIsEditing]
  );

  const closeFilePreview = useCallback(() => {
    setFilePanelMode('details');
  }, [setFilePanelMode]);

  const setEditing = useCallback(
    (editing: boolean) => {
      setIsEditing(editing);
      setEditFocus('name');
      if (editing) {
        setFilePanelMode('details');
      }
    },
    [setEditFocus, setFilePanelMode, setIsEditing]
  );

  return {
    focusedRowId,
    setFocusedRowId,
    isEditing,
    editFocus,
    filePanelMode,
    setFocusedRow,
    openFilePreview,
    openFilePreviewForRow,
    openFileEdit,
    closeFilePreview,
    setEditing,
  };
};

export { useEntityFilesPanel };
export type { FilePanelMode };
