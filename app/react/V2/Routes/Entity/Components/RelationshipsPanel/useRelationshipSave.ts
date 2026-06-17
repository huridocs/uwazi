import { useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { saveTextReference } from '#V2/api/relationships/index.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { useRelationshipsActions } from './relationshipsAtom.js';

type SaveReferenceData = {
  selection: TextSelection;
  targetEntityId: string;
  relationshipType: string;
  targetFileId?: string;
  targetSelection?: TextSelection;
};

const useRelationshipSave = (entity: Entity | undefined, mainDocument: FileType | undefined) => {
  const { setCreateReferenceSelection } = useRelationshipsActions();
  const revalidator = useRevalidator();

  const handleSaveReference = useCallback(
    async (data: SaveReferenceData) => {
      if (!entity || !mainDocument?._id) return;

      await saveTextReference({
        sourceEntitySharedId: entity.sharedId,
        sourceFileId: String(mainDocument._id),
        sourceSelection: data.selection,
        targetEntitySharedId: data.targetEntityId,
        relationshipType: data.relationshipType,
        ...(data.targetFileId && { targetFileId: data.targetFileId }),
        ...(data.targetSelection && { targetSelection: data.targetSelection }),
      });

      setCreateReferenceSelection(undefined, undefined);
      entityLoaderCache.invalidateEntity(entity.sharedId);
      await revalidator.revalidate();
    },
    [entity, mainDocument, setCreateReferenceSelection, revalidator]
  );

  const handleCancelCreate = useCallback(() => {
    setCreateReferenceSelection(undefined, undefined);
  }, [setCreateReferenceSelection]);

  return { handleSaveReference, handleCancelCreate };
};

export { useRelationshipSave };
