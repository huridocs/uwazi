import { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { FileType } from '#shared/types/fileType.js';
import {
  useDocumentPdf,
  useToc,
  useTocActions,
  useTocStateActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useToCPanelHandlers } from './useToCPanelHandlers.js';

type UseToCPanelParams = {
  toc?: TocSchema[];
  file?: FileType;
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

  useToCSync(toc, file?._id ? String(file._id) : undefined, setToc, resetToc);

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
    canMarkReviewed: Boolean(file?.generatedToc),
    expandAll,
    collapseAll,
    toggleExpand,
    ...handlers,
  };
};

export { useToCPanel };
