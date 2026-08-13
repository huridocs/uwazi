import type { Entity } from '#V2/api/entities/types.js';
import type { ConfirmAddFilePayload } from './confirmAddFileUpload.js';
import type { AddFileMode } from './useEntityFilesAdd.js';
import type { FilePanelMode } from './useEntityFilesPanel.js';
import type { EntityFileRow, FileEditFocus } from './types.js';

type FilesSideTabId = 'file' | 'translations';

type EntityFilesContextValue = {
  entity: Entity;
  primaryRows: EntityFileRow[];
  supportingRows: EntityFileRow[];
  mainDocumentId?: string;
  focusedRow?: EntityFileRow;
  selectedRowIds: string[];
  isEditing: boolean;
  editFocus: FileEditFocus;
  filePanelMode: FilePanelMode;
  pendingDeleteRows: EntityFileRow[];
  pendingAddFile: File | null;
  addFileMode: AddFileMode | null;
  uploadProgress: number | null;
  defaultLanguageKey?: string;
  navigateToFilesSideTab: (tab: FilesSideTabId) => void;
  setIsEditing: (editing: boolean) => void;
  setFocusedRowId: (rowId: string) => void;
  setSelectedRowIds: (ids: string[]) => void;
  openFilePreview: () => void;
  openFilePreviewForRow: (rowId: string) => void;
  openFileEdit: (rowId: string, focus?: FileEditFocus) => void;
  closeFilePreview: () => void;
  requestDeleteRow: (row: EntityFileRow) => void;
  requestDeleteSelected: () => void;
  closeDeleteModal: () => void;
  deleteRows: () => Promise<void>;
  saveRow: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
  requestAddFile: (mode: AddFileMode) => void;
  openAddFilePicker: () => void;
  acceptSelectedFile: (file: File | undefined) => void;
  closeAddFileModal: () => void;
  confirmAddFile: (payload: ConfirmAddFilePayload) => Promise<void>;
};

export type { EntityFilesContextValue, FilesSideTabId };
