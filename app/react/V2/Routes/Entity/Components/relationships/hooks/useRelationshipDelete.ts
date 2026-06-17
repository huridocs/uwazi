import { useCallback, useState } from 'react';
import { useRevalidator } from 'react-router';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useEntityScopedEntity } from '../../context/EntityScopedProvider.js';
import {
  deleteReferencesById,
  refreshEntityRelationships,
} from '../utils/refreshEntityRelationships.js';

const useRelationshipDelete = (
  activeRelationshipId: string | null | undefined,
  clearRelationshipSelection: () => void
) => {
  const entity = useEntityScopedEntity();
  const [relationshipToDelete, setRelationshipToDelete] = useState<RelationshipMarker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const revalidator = useRevalidator();

  const handleDeleteClick = useCallback((marker: RelationshipMarker) => {
    setRelationshipToDelete(marker);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!relationshipToDelete?._id || !entity?.sharedId) return;
    setIsDeleting(true);
    try {
      await deleteReferencesById([String(relationshipToDelete._id)]);
      setRelationshipToDelete(null);
      if (activeRelationshipId === relationshipToDelete._id) clearRelationshipSelection();
      await refreshEntityRelationships(entity.sharedId, revalidator);
    } finally {
      setIsDeleting(false);
    }
  }, [
    relationshipToDelete,
    entity?.sharedId,
    activeRelationshipId,
    clearRelationshipSelection,
    revalidator,
  ]);

  const handleCancelDelete = useCallback(() => {
    if (!isDeleting) setRelationshipToDelete(null);
  }, [isDeleting]);

  return {
    relationshipToDelete,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
};

export { useRelationshipDelete };
