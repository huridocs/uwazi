import { useCallback, useEffect } from 'react';
import { update, remove } from '#V2/api/files/index.js';
import { getFileNameAndExtension } from '#V2/shared/formatHelpers.js';
import { useEntityFilesAdd } from '#V2/Routes/Entity/Components/Files/useEntityFilesAdd.js';
import type { DocumentFieldMutations } from '#V2/Components/Metadata/EntityEditor/editEntityTypes.js';

type UseDocumentFieldMutationsArgs = {
  entitySharedId: string;
  refreshEntity: () => Promise<void>;
};

const useDocumentFieldMutations = ({
  entitySharedId,
  refreshEntity,
}: UseDocumentFieldMutationsArgs): DocumentFieldMutations => {
  const {
    pendingAddFile,
    addFileMode,
    fileInputRef,
    requestAddFile,
    confirmAddFile,
    handleFileInputChange,
  } = useEntityFilesAdd({ entitySharedId, refreshEntity });

  useEffect(() => {
    if (!pendingAddFile || addFileMode !== 'main') return;
    confirmAddFile({
      file: pendingAddFile,
      displayName: getFileNameAndExtension(pendingAddFile.name).name,
      addAs: 'primary',
    }).catch(() => undefined);
  }, [pendingAddFile, addFileMode, confirmAddFile]);

  const chooseDocument = useCallback(() => requestAddFile('main'), [requestAddFile]);

  const renameDocument: DocumentFieldMutations['renameDocument'] = useCallback(
    async (document, originalname) => {
      await update({ ...document, originalname });
      await refreshEntity();
    },
    [refreshEntity]
  );

  const removeDocument = useCallback(
    async (_id: string) => {
      await remove(_id);
      await refreshEntity();
    },
    [refreshEntity]
  );

  return {
    chooseDocument,
    renameDocument,
    removeDocument,
    fileInputRef,
    handleFileInputChange,
  };
};

export { useDocumentFieldMutations };
