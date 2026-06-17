import { useCallback, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useRelationshipsPanelEntity } from './useRelationshipsPanelEntity.js';
import { deleteReferencesById, refreshEntityRelationships } from './refreshEntityRelationships.js';

const useRelationshipBulkDelete = (selectedIds: Set<string>, onSuccess: () => void) => {
  const entity = useRelationshipsPanelEntity();
  const [isDeleting, setIsDeleting] = useState(false);
  const revalidator = useRevalidator();

  const deleteSelected = useCallback(async () => {
    if (!entity?.sharedId || selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await deleteReferencesById([...selectedIds]);
      onSuccess();
      await refreshEntityRelationships(entity.sharedId, revalidator);
    } finally {
      setIsDeleting(false);
    }
  }, [entity?.sharedId, onSuccess, revalidator, selectedIds]);

  return { isDeleting, deleteSelected };
};

export { useRelationshipBulkDelete };
