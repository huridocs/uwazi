import { useCallback, useState } from 'react';
import { useRevalidator } from 'react-router';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/index.js';
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
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const revalidator = useRevalidator();

  const handleDeleteClick = useCallback(
    (marker: RelationshipMarker, relationshipIds?: string[]) => {
      setRelationshipToDelete(marker);
      setIdsToDelete(relationshipIds?.length ? relationshipIds : [marker._id]);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!idsToDelete.length || !entity?.sharedId) return;
    setIsDeleting(true);
    try {
      await deleteReferencesById(idsToDelete.map(String));
      setRelationshipToDelete(null);
      if (activeRelationshipId && idsToDelete.includes(activeRelationshipId)) {
        clearRelationshipSelection();
      }
      await refreshEntityRelationships(entity.sharedId, revalidator);
    } finally {
      setIsDeleting(false);
    }
  }, [
    idsToDelete,
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
