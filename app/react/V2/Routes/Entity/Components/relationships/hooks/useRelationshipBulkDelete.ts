import { useCallback, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/index.js';
import {
  deleteReferencesById,
  refreshEntityRelationships,
} from '../utils/refreshEntityRelationships.js';

const useRelationshipBulkDelete = (selectedIds: Set<string>, onSuccess: () => void) => {
  const entity = useEntityScopedEntity();
  const [isDeleting, setIsDeleting] = useState(false);
  const revalidator = useRevalidator();

  const deleteSelected = useCallback(async () => {
    if (!entity?.sharedId || selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = [...selectedIds].map(String);
      await deleteReferencesById(ids);
      onSuccess();
      await refreshEntityRelationships(entity.sharedId, revalidator);
    } finally {
      setIsDeleting(false);
    }
  }, [entity?.sharedId, onSuccess, revalidator, selectedIds]);

  return { isDeleting, deleteSelected };
};

export { useRelationshipBulkDelete };
