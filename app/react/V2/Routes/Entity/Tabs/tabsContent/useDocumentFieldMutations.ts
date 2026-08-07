import { useCallback } from 'react';
import { update, remove } from '#V2/api/files/index.js';
import type { DocumentFieldMutations } from '#V2/Components/Metadata/EntityEditor/editEntityTypes.js';

type UseDocumentFieldMutationsArgs = {
  refreshEntity: () => Promise<void>;
};

const useDocumentFieldMutations = ({
  refreshEntity,
}: UseDocumentFieldMutationsArgs): DocumentFieldMutations => {
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
    renameDocument,
    removeDocument,
  };
};

export { useDocumentFieldMutations };
