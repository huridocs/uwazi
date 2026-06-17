import { useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import type { FileType } from '#V2/api/entities/types.js';
import { saveTextReference } from '#V2/api/relationships/index.js';
import { useEntityScopedEntity, useRelationshipsActions } from '../EntityScopedProvider.js';
import { refreshEntityRelationships } from './refreshEntityRelationships.js';

type SaveReferenceData = {
  selection: TextSelection;
  targetEntityId: string;
  relationshipType: string;
  targetFileId?: string;
  targetSelection?: TextSelection;
};

const useRelationshipSave = (mainDocument?: FileType) => {
  const entity = useEntityScopedEntity();
  const { setCreateReferenceSelection } = useRelationshipsActions();
  const revalidator = useRevalidator();
  const document = mainDocument ?? entity?.documents?.[0];

  const handleSaveReference = useCallback(
    async (data: SaveReferenceData) => {
      if (!entity || !document?._id) return;

      await saveTextReference({
        sourceEntitySharedId: entity.sharedId,
        sourceFileId: String(document._id),
        sourceSelection: data.selection,
        targetEntitySharedId: data.targetEntityId,
        relationshipType: data.relationshipType,
        ...(data.targetFileId && { targetFileId: data.targetFileId }),
        ...(data.targetSelection && { targetSelection: data.targetSelection }),
      });

      setCreateReferenceSelection(undefined, undefined);
      await refreshEntityRelationships(entity.sharedId, revalidator);
    },
    [document, entity, setCreateReferenceSelection, revalidator]
  );

  const handleCancelCreate = useCallback(() => {
    setCreateReferenceSelection(undefined, undefined);
  }, [setCreateReferenceSelection]);

  return { handleSaveReference, handleCancelCreate };
};

export { useRelationshipSave };
