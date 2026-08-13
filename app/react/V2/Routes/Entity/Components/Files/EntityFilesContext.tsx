import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useRevalidator } from 'react-router';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { Entity } from '#V2/api/entities/types.js';
import { update } from '#V2/api/files/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { buildEntityFileRows } from './buildEntityFileRows.js';
import { useEntityFilesAdd } from './useEntityFilesAdd.js';
import { useEntityFilesDelete } from './useEntityFilesDelete.js';
import { useEntityFilesPanel } from './useEntityFilesPanel.js';
import { useEntityFilesSocketRefresh } from './useEntityFilesSocketRefresh.js';
import type { EntityFilesContextValue, FilesSideTabId } from './entityFilesContextTypes.js';

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

  const {
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
  } = useEntityFilesPanel();

  const { primaryRows, supportingRows, mainDocumentId } = useMemo(
    () => buildEntityFileRows(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );

  const allRows = useMemo(() => [...primaryRows, ...supportingRows], [primaryRows, supportingRows]);
  const resolvedFocusedRowId = focusedRowId || mainDocumentId || allRows[0]?.rowId;
  const focusedRow = allRows.find(row => row.rowId === resolvedFocusedRowId);

  const refreshEntity = useCallback(async () => {
    entityLoaderCache.invalidateEntity(entity.sharedId);
    await revalidate();
  }, [entity.sharedId, revalidate]);

  const saveRow = useCallback(
    async (payload: { _id: string; originalname: string; language?: string }) => {
      await update(payload);
      await refreshEntity();
      setEditing(false);
    },
    [refreshEntity, setEditing]
  );

  const {
    pendingDeleteRows,
    requestDeleteRow,
    requestDeleteSelected,
    closeDeleteModal,
    deleteRows,
  } = useEntityFilesDelete({
    allRows,
    selectedRowIds,
    setSelectedRowIds,
    setFocusedRowId,
    refreshEntity,
  });

  const {
    pendingAddFile,
    addFileMode,
    uploadProgress,
    fileInputRef,
    requestAddFile,
    openAddFilePicker,
    acceptSelectedFile,
    closeAddFileModal,
    confirmAddFile,
    handleFileInputChange,
  } = useEntityFilesAdd({
    entitySharedId: entity.sharedId,
    refreshEntity,
  });

  useEntityFilesSocketRefresh({
    sharedId: entity.sharedId,
    isFileEditing: isEditing,
    refreshEntity,
  });

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

  const value = useMemo(
    () => ({
      entity,
      primaryRows,
      supportingRows,
      mainDocumentId,
      focusedRow,
      selectedRowIds,
      isEditing,
      editFocus,
      filePanelMode,
      pendingDeleteRows,
      pendingAddFile,
      addFileMode,
      uploadProgress,
      defaultLanguageKey: defaultLanguage,
      navigateToFilesSideTab,
      setIsEditing: setEditing,
      setFocusedRowId: setFocusedRow,
      setSelectedRowIds,
      openFilePreview,
      openFilePreviewForRow,
      openFileEdit,
      closeFilePreview,
      requestDeleteRow,
      requestDeleteSelected,
      closeDeleteModal,
      deleteRows,
      saveRow,
      requestAddFile,
      openAddFilePicker,
      acceptSelectedFile,
      closeAddFileModal,
      confirmAddFile,
    }),
    [
      entity,
      primaryRows,
      supportingRows,
      mainDocumentId,
      focusedRow,
      selectedRowIds,
      isEditing,
      editFocus,
      filePanelMode,
      pendingDeleteRows,
      pendingAddFile,
      addFileMode,
      uploadProgress,
      defaultLanguage,
      navigateToFilesSideTab,
      setEditing,
      setFocusedRow,
      requestDeleteRow,
      requestDeleteSelected,
      openFilePreview,
      openFilePreviewForRow,
      openFileEdit,
      closeFilePreview,
      closeDeleteModal,
      deleteRows,
      saveRow,
      requestAddFile,
      openAddFilePicker,
      acceptSelectedFile,
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
