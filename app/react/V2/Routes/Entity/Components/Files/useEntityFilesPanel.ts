import { useCallback, useState } from 'react';
import { FileEditFocus } from './types.js';

type FilePanelMode = 'details' | 'preview';

const useEntityFilesPanel = () => {
  const [focusedRowId, setFocusedRowId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<FileEditFocus>('name');
  const [filePanelMode, setFilePanelMode] = useState<FilePanelMode>('details');

  const setFocusedRow = useCallback((rowId: string) => {
    setFocusedRowId(rowId);
    setIsEditing(false);
    setEditFocus('name');
    setFilePanelMode('details');
  }, []);

  const openFilePreview = useCallback(() => {
    setIsEditing(false);
    setFilePanelMode('preview');
  }, []);

  const openFilePreviewForRow = useCallback((rowId: string) => {
    setFocusedRowId(rowId);
    setIsEditing(false);
    setEditFocus('name');
    setFilePanelMode('preview');
  }, []);

  const openFileEdit = useCallback((rowId: string, focus: FileEditFocus = 'name') => {
    setFocusedRowId(rowId);
    setFilePanelMode('details');
    setEditFocus(focus);
    setIsEditing(true);
  }, []);

  const closeFilePreview = useCallback(() => {
    setFilePanelMode('details');
  }, []);

  const setEditing = useCallback((editing: boolean) => {
    setIsEditing(editing);
    setEditFocus('name');
    if (editing) {
      setFilePanelMode('details');
    }
  }, []);

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
