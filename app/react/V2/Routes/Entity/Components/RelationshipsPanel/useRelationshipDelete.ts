import { useCallback, useState } from 'react';
import { useRevalidator } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { deleteReference } from '#V2/api/relationships/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';

const useRelationshipDelete = (
  entity: Entity | undefined,
  activeRelationshipId: string | null | undefined,
  clearRelationshipSelection: () => void
) => {
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
      await deleteReference(String(relationshipToDelete._id));
      setRelationshipToDelete(null);
      if (activeRelationshipId === relationshipToDelete._id) clearRelationshipSelection();
      entityLoaderCache.invalidateEntity(entity.sharedId);
      await revalidator.revalidate();
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
