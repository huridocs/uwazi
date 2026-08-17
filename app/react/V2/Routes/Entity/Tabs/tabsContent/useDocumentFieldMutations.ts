import { useCallback } from 'react';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { FileType } from '#shared/types/fileType.js';
import { update, remove } from '#V2/api/files/index.js';
import type { DocumentFieldMutations } from '#V2/Components/Metadata/EntityEditor/editEntityTypes.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';

type UseDocumentFieldMutationsArgs = {
  sharedId: string;
  language: string;
  applyUpdatedFile: (file: FileType) => void;
  revalidate: () => Promise<void>;
  refreshEntity: () => Promise<void>;
};

const useDocumentFieldMutations = ({
  sharedId,
  language,
  applyUpdatedFile,
  revalidate,
  refreshEntity,
}: UseDocumentFieldMutationsArgs): DocumentFieldMutations => {
  const renameDocument: DocumentFieldMutations['renameDocument'] = useCallback(
    async (document, originalname) => {
      const result = await update({ ...document, originalname });
      if (result instanceof FetchResponseError) {
        throw result;
      }
      const updated = { ...document, ...result, originalname };
      entityLoaderCache.patchFile(sharedId, language, updated);
      applyUpdatedFile(updated);
      await revalidate();
    },
    [applyUpdatedFile, language, revalidate, sharedId]
  );

  const removeDocument = useCallback(
    async (_id: string) => {
      await remove(_id);
      await refreshEntity();
    },
    [refreshEntity]
  );

  return {
    renameDocument,
    removeDocument,
  };
};

export { useDocumentFieldMutations };
