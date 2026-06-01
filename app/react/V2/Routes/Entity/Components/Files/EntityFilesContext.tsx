import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useRevalidator, useSearchParams } from 'react-router';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { FileType } from '#shared/types/fileType.js';
import { Entity } from '#V2/api/entities/types.js';
import { remove, update, UploadService } from '#V2/api/files/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { buildEntityFileRows } from './buildEntityFileRows.js';
import { EntityFileRow } from './types.js';

type FilesSideTabId = 'file' | 'translations';

type EntityFilesContextValue = {
  entity: Entity;
  primaryRows: EntityFileRow[];
  supportingRows: EntityFileRow[];
  focusedRow?: EntityFileRow;
  selectedRowIds: string[];
  isEditing: boolean;
  pendingDeleteRow?: EntityFileRow;
  navigateToFilesSideTab: (tab: FilesSideTabId) => void;
  setIsEditing: (editing: boolean) => void;
  setFocusedRowId: (rowId: string) => void;
  setSelectedRowIds: (ids: string[]) => void;
  requestDeleteRow: (row?: EntityFileRow) => void;
  closeDeleteModal: () => void;
  deleteRow: () => Promise<void>;
  saveRow: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
  uploadTranslation: (files: File[]) => Promise<void>;
};

const EntityFilesContext = createContext<EntityFilesContextValue | null>(null);

const EntityFilesProvider = ({ entity, children }: { entity: Entity; children: React.ReactNode }) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const { revalidate } = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [focusedRowId, setFocusedRowId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<EntityFileRow>();

  const { primaryRows, supportingRows, mainDocumentId } = useMemo(
    () => buildEntityFileRows(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );

  const allRows = useMemo(() => [...primaryRows, ...supportingRows], [primaryRows, supportingRows]);

  const resolvedFocusedRowId = focusedRowId || mainDocumentId || allRows[0]?.rowId;
  const focusedRow = allRows.find(row => row.rowId === resolvedFocusedRowId);

  const saveRow = useCallback(
    async (payload: { _id: string; originalname: string; language?: string }) => {
      await update(payload as FileType);
      await revalidate();
      setIsEditing(false);
    },
    [revalidate]
  );

  const requestDeleteRow = useCallback((row?: EntityFileRow) => {
    setPendingDeleteRow(row);
  }, []);

  const closeDeleteModal = useCallback(() => setPendingDeleteRow(undefined), []);

  const deleteRow = useCallback(async () => {
    if (!pendingDeleteRow?.raw?._id) {
      setPendingDeleteRow(undefined);
      return;
    }
    await remove(pendingDeleteRow.raw._id);
    setPendingDeleteRow(undefined);
    await revalidate();
  }, [pendingDeleteRow, revalidate]);

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
      await revalidate();
      navigateToFilesSideTab('translations');
    },
    [entity.sharedId, navigateToFilesSideTab, revalidate]
  );

  const value = useMemo(
    () => ({
      entity,
      primaryRows,
      supportingRows,
      focusedRow,
      selectedRowIds,
      isEditing,
      pendingDeleteRow,
      navigateToFilesSideTab,
      setIsEditing,
      setFocusedRowId,
      setSelectedRowIds,
      requestDeleteRow,
      closeDeleteModal,
      deleteRow,
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
      pendingDeleteRow,
      navigateToFilesSideTab,
      requestDeleteRow,
      closeDeleteModal,
      deleteRow,
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
