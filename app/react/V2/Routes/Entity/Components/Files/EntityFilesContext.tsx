import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useRevalidator } from 'react-router';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { FileType } from '#shared/types/fileType.js';
import { Entity } from '#V2/api/entities/types.js';
import { remove, update, UploadService } from '#V2/api/files/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { buildEntityFileRows } from './buildEntityFileRows.js';
import { EntityFileRow } from './types.js';
import { isPdfFile } from './fileUploadHelpers.js';

type FilesSideTabId = 'file' | 'translations';
type FilePanelMode = 'details' | 'preview';
type AddFileMode = 'main' | 'translation';

type ConfirmAddFilePayload = {
  file: File;
  displayName: string;
  addAs: 'supporting' | 'primary';
  language?: string;
};

type EntityFilesContextValue = {
  entity: Entity;
  primaryRows: EntityFileRow[];
  supportingRows: EntityFileRow[];
  focusedRow?: EntityFileRow;
  selectedRowIds: string[];
  isEditing: boolean;
  filePanelMode: FilePanelMode;
  pendingDeleteRows: EntityFileRow[];
  pendingAddFile: File | null;
  addFileMode: AddFileMode | null;
  defaultLanguageKey?: string;
  navigateToFilesSideTab: (tab: FilesSideTabId) => void;
  setIsEditing: (editing: boolean) => void;
  setFocusedRowId: (rowId: string) => void;
  setSelectedRowIds: (ids: string[]) => void;
  openFilePreview: () => void;
  closeFilePreview: () => void;
  requestDeleteRow: (row: EntityFileRow) => void;
  requestDeleteSelected: () => void;
  closeDeleteModal: () => void;
  deleteRows: () => Promise<void>;
  saveRow: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
  requestAddFile: (mode: AddFileMode) => void;
  closeAddFileModal: () => void;
  confirmAddFile: (payload: ConfirmAddFilePayload) => Promise<void>;
};

const EntityFilesContext = createContext<EntityFilesContextValue | null>(null);

const EntityFilesProvider = ({
  entity,
  children,
}: {
  entity: Entity;
  children: React.ReactNode;
}) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const { revalidate } = useRevalidator();
  const updateEntityUrl = useUpdateEntityUrl();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [focusedRowId, setFocusedRowId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [filePanelMode, setFilePanelMode] = useState<FilePanelMode>('details');
  const [pendingDeleteRows, setPendingDeleteRows] = useState<EntityFileRow[]>([]);
  const [pendingAddFile, setPendingAddFile] = useState<File | null>(null);
  const [addFileMode, setAddFileMode] = useState<AddFileMode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileModeRef = useRef<AddFileMode | null>(null);

  const { primaryRows, supportingRows, mainDocumentId } = useMemo(
    () => buildEntityFileRows(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );

  const allRows = useMemo(() => [...primaryRows, ...supportingRows], [primaryRows, supportingRows]);

  const resolvedFocusedRowId = focusedRowId || mainDocumentId || allRows[0]?.rowId;
  const focusedRow = allRows.find(row => row.rowId === resolvedFocusedRowId);

  const setFocusedRow = useCallback((rowId: string) => {
    setFocusedRowId(rowId);
    setIsEditing(false);
    setFilePanelMode('details');
  }, []);

  const openFilePreview = useCallback(() => {
    setIsEditing(false);
    setFilePanelMode('preview');
  }, []);

  const closeFilePreview = useCallback(() => {
    setFilePanelMode('details');
  }, []);

  const refreshEntity = useCallback(async () => {
    entityLoaderCache.invalidateEntity(entity.sharedId);
    await revalidate();
  }, [entity.sharedId, revalidate]);

  const saveRow = useCallback(
    async (payload: { _id: string; originalname: string; language?: string }) => {
      await update(payload as FileType);
      await refreshEntity();
      setIsEditing(false);
    },
    [refreshEntity]
  );

  const requestDeleteRow = useCallback((row: EntityFileRow) => {
    setPendingDeleteRows([row]);
  }, []);

  const requestDeleteSelected = useCallback(() => {
    const rows = allRows.filter(row => selectedRowIds.includes(row.rowId));
    setPendingDeleteRows(rows);
  }, [allRows, selectedRowIds]);

  const closeDeleteModal = useCallback(() => setPendingDeleteRows([]), []);

  const deleteRows = useCallback(async () => {
    const ids = pendingDeleteRows.map(row => row.raw._id).filter(Boolean) as string[];
    if (!ids.length) {
      setPendingDeleteRows([]);
      return;
    }
    const deletedRowIds = new Set(pendingDeleteRows.map(row => row.rowId));
    await Promise.all(
      ids.map(async id => {
        await remove(id);
      })
    );
    setPendingDeleteRows([]);
    setSelectedRowIds(prev => prev.filter(id => !deletedRowIds.has(id)));
    setFocusedRowId(prev => (prev && deletedRowIds.has(prev) ? undefined : prev));
    ids.forEach(id => entityLoaderCache.invalidatePlaintext(id));
    await refreshEntity();
  }, [pendingDeleteRows, refreshEntity]);

  const navigateToFilesSideTab = useCallback(
    (tab: FilesSideTabId) => {
      updateEntityUrl({
        search: next => {
          next.set(MAIN_TAB_PARAM, 'files');
        },
        hash: hash => {
          hash.set(SIDE_TAB_PARAM, tab);
        },
      });
    },
    [updateEntityUrl]
  );

  const closeAddFileModal = useCallback(() => {
    setPendingAddFile(null);
    setAddFileMode(null);
    addFileModeRef.current = null;
  }, []);

  const requestAddFile = useCallback((mode: AddFileMode) => {
    addFileModeRef.current = mode;
    setAddFileMode(mode);
    if (fileInputRef.current) {
      fileInputRef.current.accept = mode === 'translation' ? '.pdf,application/pdf' : '';
      fileInputRef.current.click();
    }
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    const mode = addFileModeRef.current;
    if (!selectedFile || !mode) {
      setAddFileMode(null);
      addFileModeRef.current = null;
      return;
    }

    if (mode === 'translation' && !isPdfFile(selectedFile)) {
      setAddFileMode(null);
      addFileModeRef.current = null;
      return;
    }

    setPendingAddFile(selectedFile);
  }, []);

  const confirmAddFile = useCallback(
    async ({ file, displayName, addAs, language }: ConfirmAddFilePayload) => {
      const { extension } = getFileNameAndExtension(file.name);
      const originalname = extension ? `${displayName}.${extension}` : displayName;
      const endpoint = addAs === 'primary' ? 'document' : 'attachment';
      const service = new UploadService(endpoint, {
        entity: entity.sharedId,
        originalname,
      });
      const responses = await service.upload([file]);
      const uploaded = responses[0];

      if (!uploaded || !('_id' in uploaded)) {
        return;
      }

      if (language) {
        await update({ ...uploaded, originalname, language } as FileType);
      }

      closeAddFileModal();
      await refreshEntity();
    },
    [closeAddFileModal, entity.sharedId, refreshEntity]
  );

  const value = useMemo(
    () => ({
      entity,
      primaryRows,
      supportingRows,
      focusedRow,
      selectedRowIds,
      isEditing,
      filePanelMode,
      pendingDeleteRows,
      pendingAddFile,
      addFileMode,
      defaultLanguageKey: defaultLanguage,
      navigateToFilesSideTab,
      setIsEditing,
      setFocusedRowId: setFocusedRow,
      setSelectedRowIds,
      openFilePreview,
      closeFilePreview,
      requestDeleteRow,
      requestDeleteSelected,
      closeDeleteModal,
      deleteRows,
      saveRow,
      requestAddFile,
      closeAddFileModal,
      confirmAddFile,
    }),
    [
      entity,
      primaryRows,
      supportingRows,
      focusedRow,
      selectedRowIds,
      isEditing,
      filePanelMode,
      pendingDeleteRows,
      pendingAddFile,
      addFileMode,
      defaultLanguage,
      navigateToFilesSideTab,
      setFocusedRow,
      requestDeleteRow,
      requestDeleteSelected,
      openFilePreview,
      closeFilePreview,
      closeDeleteModal,
      deleteRows,
      saveRow,
      requestAddFile,
      closeAddFileModal,
      confirmAddFile,
    ]
  );

  return (
    <EntityFilesContext.Provider value={value}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        aria-hidden
        tabIndex={-1}
      />
      {children}
    </EntityFilesContext.Provider>
  );
};

const useEntityFiles = () => {
  const context = useContext(EntityFilesContext);
  if (!context) {
    throw new Error('Entity files context not found');
  }
  return context;
};

export { EntityFilesProvider, useEntityFiles };
