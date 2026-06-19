import { useCallback } from 'react';
import { useRevalidator } from 'react-router';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { FileType } from '#V2/api/entities/types.js';
import { saveTextReference } from '#V2/api/relationships/index.js';
import {
  useEntityScopedEntity,
  useRelationshipsActions,
  useRelationshipsPanelFacetFilters,
} from '#V2/Routes/Entity/Components/context/index.js';
import { createWholeDocumentSelection } from '../create-reference/createWholeDocumentSelection.js';
import { refreshEntityRelationships } from '../utils/refreshEntityRelationships.js';

type SaveReferenceData = {
  selection?: TextSelection;
  targetEntityId: string;
  relationshipType: string;
  targetFileId?: string;
  targetSelection?: TextSelection;
  sourcePage?: string;
};

const useRelationshipSave = (mainDocument?: FileType) => {
  const entity = useEntityScopedEntity();
  const { closeCreateRelationship } = useRelationshipsActions();
  const { clearFilters } = useRelationshipsPanelFacetFilters();
  const revalidator = useRevalidator();
  const document = mainDocument ?? entity?.documents?.[0];

  const handleSaveReference = useCallback(
    async (data: SaveReferenceData) => {
      if (!entity || !document?._id) return;

      const sourceSelection =
        data.selection ?? createWholeDocumentSelection(data.sourcePage ?? '1');

      await saveTextReference({
        sourceEntitySharedId: entity.sharedId,
        sourceFileId: String(document._id),
        sourceSelection,
        targetEntitySharedId: data.targetEntityId,
        relationshipType: data.relationshipType,
        ...(data.targetFileId && { targetFileId: data.targetFileId }),
        ...(data.targetSelection && { targetSelection: data.targetSelection }),
      });

      clearFilters();
      closeCreateRelationship();
      await refreshEntityRelationships(entity.sharedId, revalidator);
    },
    [clearFilters, closeCreateRelationship, document, entity, revalidator]
  );

  const handleCancelCreate = useCallback(() => {
    closeCreateRelationship();
  }, [closeCreateRelationship]);

  return { handleSaveReference, handleCancelCreate };
};

export { useRelationshipSave };
