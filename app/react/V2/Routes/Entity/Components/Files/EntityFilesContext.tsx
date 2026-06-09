import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useRevalidator, useSearchParams } from 'react-router';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { FileType } from '#shared/types/fileType.js';
import { Entity } from '#V2/api/entities/types.js';
import { remove, update, UploadService } from '#V2/api/files/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { buildEntityFileRows } from './buildEntityFileRows.js';
import { EntityFileRow } from './types.js';

type FilesSideTabId = 'file' | 'translations';
type FilePanelMode = 'details' | 'preview';

type EntityFilesContextValue = {
  entity: Entity;
  primaryRows: EntityFileRow[];
  supportingRows: EntityFileRow[];
  focusedRow?: EntityFileRow;
  selectedRowIds: string[];
  isEditing: boolean;
  filePanelMode: FilePanelMode;
  pendingDeleteRows: EntityFileRow[];
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
  uploadTranslation: (files: File[]) => Promise<void>;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [focusedRowId, setFocusedRowId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [filePanelMode, setFilePanelMode] = useState<FilePanelMode>('details');
  const [pendingDeleteRows, setPendingDeleteRows] = useState<EntityFileRow[]>([]);

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
      const next = new URLSearchParams(searchParams.toString());
      next.set(MAIN_TAB_PARAM, 'files');
      next.set(SIDE_TAB_PARAM, tab);
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const uploadTranslation = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const service = new UploadService('document', { entity: entity.sharedId });
      await service.upload(files);
      await refreshEntity();
      navigateToFilesSideTab('translations');
    },
    [entity.sharedId, navigateToFilesSideTab, refreshEntity]
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
      uploadTranslation,
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
      navigateToFilesSideTab,
      setFocusedRow,
      requestDeleteRow,
      requestDeleteSelected,
      openFilePreview,
      closeFilePreview,
      closeDeleteModal,
      deleteRows,
      saveRow,
      uploadTranslation,
    ]
  );

  return <EntityFilesContext.Provider value={value}>{children}</EntityFilesContext.Provider>;
};

const useEntityFiles = () => {
  const context = useContext(EntityFilesContext);
  if (!context) {
    throw new Error('Entity files context not found');
  }
  return context;
};

export { EntityFilesProvider, useEntityFiles };
