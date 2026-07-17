import { useCallback, useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { TocSchema } from '#shared/types/commonTypes.js';
import { update as updateFile } from '#V2/api/files/index.js';
import type { FileType } from '#shared/types/fileType.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { type ProcessedTocEntry, sortTocEntries } from './ToC.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import {
  useDocumentPdf,
  useToc,
  useTocActions,
  useTocStateActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { getPageNumber } from './utils.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

type UseToCPanelParams = {
  toc?: TocSchema[];
  file?: FileType;
};

type SaveTocParams = {
  file: FileType;
  toc: TocSchema[];
  revalidate: () => Promise<void>;
  onError: () => void;
  onSuccess: () => void;
};

type ToCPanelHandlersParams = {
  toc?: TocSchema[];
  file?: FileType;
  tocState: ReturnType<typeof useToc>;
  setToc: ReturnType<typeof useTocActions>['setToc'];
  setEditMode: ReturnType<typeof useTocActions>['setEditMode'];
  updateEntry: ReturnType<typeof useTocActions>['updateEntry'];
  deleteEntry: ReturnType<typeof useTocActions>['deleteEntry'];
  setTocState: ReturnType<typeof useTocStateActions>['setTocState'];
  mainPdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
  revalidate: () => Promise<void>;
  notify: ReturnType<typeof useRequestStatus>['notify'];
};

const saveToc = async ({ file, toc, revalidate, onError, onSuccess }: SaveTocParams) => {
  const result = await updateFile({
    ...file,
    toc: sortTocEntries(toc),
  });

  if (result instanceof FetchResponseError || result instanceof Error) {
    onError();
    return;
  }

  if (file.entity) {
    entityLoaderCache.invalidateEntity(file.entity);
  }
  await revalidate();
  onSuccess();
};

const useToCSync = (
  toc: TocSchema[] | undefined,
  fileId: string | undefined,
  setToc: ReturnType<typeof useTocActions>['setToc'],
  resetToc: ReturnType<typeof useTocActions>['reset']
) => {
  const previousFileId = useRef(fileId);

  useEffect(() => {
    if (previousFileId.current !== fileId) {
      previousFileId.current = fileId;
      resetToc();
    }
    setToc(toc);
  }, [fileId, toc, setToc, resetToc]);

  useEffect(
    () => () => {
      resetToc();
    },
    [resetToc]
  );
};

const useToCPanelHandlers = ({
  toc,
  file,
  tocState,
  setToc,
  setEditMode,
  updateEntry,
  deleteEntry,
  setTocState,
  mainPdfController,
  revalidate,
  notify,
}: ToCPanelHandlersParams) => {
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
    if (!file?._id || !tocState.toc) {
      setEditMode(false);
      return;
    }

    const saveError = () =>
      notify('error', t('System', 'Failed to save table of contents', null, false));

    setTocState(current => ({ ...current, isSaving: true }));
    try {
      await saveToc({
        file,
        toc: tocState.toc,
        revalidate,
        onError: saveError,
        onSuccess: () => {
          notify('success', t('System', 'Table of contents saved successfully', null, false));
          setEditMode(false);
        },
      });
    } catch {
      saveError();
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
  const { setTocState } = useTocStateActions();
  const { pdfController: mainPdfController } = useDocumentPdf();

  useToCSync(toc, file?._id, setToc, resetToc);

  const handlers = useToCPanelHandlers({
    toc,
    file,
    tocState,
    setToc,
    setEditMode,
    updateEntry,
    deleteEntry,
    setTocState,
    mainPdfController,
    revalidate: async () => revalidator.revalidate(),
    notify,
  });

  return {
    tocState,
    isAllExpanded: tocState.isAllExpanded,
    isAllCollapsed: tocState.isAllCollapsed,
    isSaving: tocState.isSaving,
    expandAll,
    collapseAll,
    toggleExpand,
    ...handlers,
  };
};

export { useToCPanel };
