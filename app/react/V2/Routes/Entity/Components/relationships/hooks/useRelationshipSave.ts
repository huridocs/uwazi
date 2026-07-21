import { useCallback } from 'react';
import { useRevalidator } from 'react-router';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { FileType } from '#V2/api/entities/types.js';
import { saveEntityRelationship, saveTextReference } from '#V2/api/relationships/index.js';
import {
  useDocumentPdfActions,
  useEntityScopedEntity,
  useRelationshipsActions,
  useRelationshipsPanelFacetFilters,
} from '#V2/Routes/Entity/Components/context/index.js';
import { refreshEntityRelationships } from '../utils/refreshEntityRelationships.js';

type Revalidator = Parameters<typeof refreshEntityRelationships>[1];

type SaveReferenceData = {
  selection?: TextSelection;
  targetEntityId: string;
  relationshipType: string;
  targetFileId?: string;
  targetSelection?: TextSelection;
  sourcePage?: string;
};

type PersistRelationshipParams = SaveReferenceData & {
  entitySharedId: string;
  sourceFileId?: string | number;
};

const persistRelationship = async ({
  entitySharedId,
  sourceFileId,
  selection,
  targetEntityId,
  relationshipType,
  targetFileId,
  targetSelection,
}: PersistRelationshipParams) => {
  const hasSourceTextSelection = Boolean(selection?.selectionRectangles?.length);
  if (hasSourceTextSelection && !sourceFileId) return false;

  const sharedTarget = {
    targetEntitySharedId: targetEntityId,
    relationshipType,
    ...(targetFileId && { targetFileId }),
    ...(targetSelection && { targetSelection }),
  };

  const result = hasSourceTextSelection
    ? await saveTextReference({
        sourceEntitySharedId: entitySharedId,
        sourceFileId: String(sourceFileId),
        sourceSelection: selection!,
        ...sharedTarget,
      })
    : await saveEntityRelationship({
        sourceEntitySharedId: entitySharedId,
        ...sharedTarget,
      });

  return !(result instanceof Error);
};

type FinalizeSaveActions = {
  setActiveClusterRefIds: (value: null) => void;
  setDocumentPdfSelection: (value: undefined) => void;
  closeCreateRelationship: () => void;
};

const finalizeSuccessfulSave = async (
  entitySharedId: string,
  revalidator: Revalidator,
  actions: FinalizeSaveActions
) => {
  try {
    await refreshEntityRelationships(entitySharedId, revalidator);
  } catch {
    // saved; panel may be stale until next navigation
  }

  actions.setActiveClusterRefIds(null);
  actions.setDocumentPdfSelection(undefined);
  actions.closeCreateRelationship();
};

const useRelationshipSave = (mainDocument?: FileType) => {
  const entity = useEntityScopedEntity();
  const { closeCreateRelationship } = useRelationshipsActions();
  const { setDocumentPdfSelection } = useDocumentPdfActions();
  const { setActiveClusterRefIds } = useRelationshipsPanelFacetFilters();
  const revalidator = useRevalidator();
  const document = mainDocument ?? entity?.documents?.[0];

  const handleSaveReference = useCallback(
    async (data: SaveReferenceData): Promise<boolean> => {
      if (!entity) return false;

      const saved = await persistRelationship({
        ...data,
        entitySharedId: entity.sharedId,
        sourceFileId: document?._id,
      });
      if (!saved) return false;

      await finalizeSuccessfulSave(entity.sharedId, revalidator, {
        setActiveClusterRefIds,
        setDocumentPdfSelection,
        closeCreateRelationship,
      });
      return true;
    },
    [
      closeCreateRelationship,
      document,
      entity,
      revalidator,
      setActiveClusterRefIds,
      setDocumentPdfSelection,
    ]
  );

  const handleCancelCreate = useCallback(() => {
    closeCreateRelationship();
  }, [closeCreateRelationship]);

  return { handleSaveReference, handleCancelCreate };
};

export { useRelationshipSave };
