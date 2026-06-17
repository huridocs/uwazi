import { useEffect, useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { TocSchema } from '#shared/types/commonTypes.js';
import { update as updateFile } from '#V2/api/files/index.js';
import type { FileType } from '#shared/types/fileType.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { type ProcessedTocEntry, sortTocEntries } from './ToC.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import {
  useDocumentInteraction,
  useEntityScopedContext,
  useToc,
  useTocActions,
} from '../context/EntityScopedProvider.js';
import { getPageNumber } from './utils.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

type UseToCPanelParams = {
  toc?: TocSchema[];
  file?: FileType;
};

const useToCPanel = ({ toc, file }: UseToCPanelParams) => {
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();
  const tocState = useToc();
  const {
    setToc,
    expandAll,
    collapseAll,
    setEditMode,
    updateEntry,
    deleteEntry,
    toggleExpand,
    reset: resetToc,
  } = useTocActions();

  const { setTocState } = useEntityScopedContext();
  const { pdfController: mainPdfController } = useDocumentInteraction();

  useEffect(() => {
    setToc(toc);
  }, [toc, setToc]);

  useEffect(
    () => () => {
      resetToc();
    },
    [resetToc]
  );

  const handleStateChange = (expanded: boolean, collapsed: boolean) => {
    setTocState(current => ({ ...current, isAllExpanded: expanded, isAllCollapsed: collapsed }));
  };

  const handleToCEntryClick = useCallback(
    (entry: ProcessedTocEntry) => {
      const pageNumber = getPageNumber(entry.entry);
      if (pageNumber !== null) {
        mainPdfController?.goToPage(pageNumber);
      }
    },
    [mainPdfController]
  );

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!file || !file._id || !tocState.toc) {
      setEditMode(false);
      return;
    }

    setTocState(current => ({ ...current, isSaving: true }));
    try {
      const sortedToc = sortTocEntries(tocState.toc);
      const updatedFile: FileType = {
        ...file,
        toc: sortedToc,
      };
      const result = await updateFile(updatedFile);

      if (result instanceof FetchResponseError || result instanceof Error) {
        notify('error', t('System', 'Failed to save table of contents', null, false));
      } else {
        if (file.entity) {
          entityLoaderCache.invalidateEntity(file.entity);
        }
        await revalidator.revalidate();
        notify('success', t('System', 'Table of contents saved successfully', null, false));
        setEditMode(false);
      }
    } catch (error) {
      notify('error', t('System', 'Failed to save table of contents', null, false));
    } finally {
      setTocState(current => ({ ...current, isSaving: false }));
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setToc(toc);
  };

  const handleEntryUpdate = useCallback(
    (index: number, updates: Partial<TocSchema>) => {
      if (!tocState.toc) return;
      updateEntry(index, updates);
    },
    [tocState.toc, updateEntry]
  );

  const handleIndentationChange = useCallback(
    (index: number, newIndentation: number) => {
      handleEntryUpdate(index, { indentation: newIndentation });
    },
    [handleEntryUpdate]
  );

  const handleDelete = useCallback(
    (index: number) => {
      if (!tocState.toc) return;
      deleteEntry(index);
    },
    [tocState.toc, deleteEntry]
  );

  const handleLabelChange = useCallback(
    (index: number, newLabel: string) => {
      handleEntryUpdate(index, { label: newLabel });
    },
    [handleEntryUpdate]
  );

  return {
    tocState,
    isAllExpanded: tocState.isAllExpanded,
    isAllCollapsed: tocState.isAllCollapsed,
    isSaving: tocState.isSaving,
    expandAll,
    collapseAll,
    toggleExpand,
    handleStateChange,
    handleToCEntryClick,
    handleEdit,
    handleSave,
    handleCancel,
    handleIndentationChange,
    handleDelete,
    handleLabelChange,
  };
};

export { useToCPanel };
