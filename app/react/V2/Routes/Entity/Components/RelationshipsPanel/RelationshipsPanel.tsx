import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { deleteReference, saveTextReference } from '#V2/api/relationships/index.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { CreateReference } from './CreateReference.js';
import { RelationshipsPanelToolbar } from './RelationshipsPanelToolbar.js';
import { RelationshipsPanelBody } from './RelationshipsPanelBody.js';
import {
  useRelationships,
  useRelationshipsActions,
  relationshipsEditModeAtom,
  selectedRelationshipIdsAtom,
} from './relationshipsAtom.js';
import { relationshipsPanelFiltersDrawerOpenAtom } from './relationshipsPanelFiltersAtom.js';
import { useRelationshipSelection } from '../useRelationshipSelection.js';
import { useRelationshipsPanelData } from './useRelationshipsPanelData.js';

type RelationshipsPanelProps = {
  entity?: Entity;
  mainDocument?: FileType;
};

const RelationshipsPanel = ({ entity, mainDocument }: RelationshipsPanelProps) => {
  const [relationshipToDelete, setRelationshipToDelete] = useState<RelationshipMarker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { createReferenceSelection, createReferenceMode } = useRelationships();
  const { setCreateReferenceSelection } = useRelationshipsActions();
  const revalidator = useRevalidator();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useRelationshipSelection();
  const { markers, stats, hasRelationships } = useRelationshipsPanelData(entity);
  const setFiltersOpen = useSetAtom(relationshipsPanelFiltersDrawerOpenAtom);
  const resetEditMode = useSetAtom(relationshipsEditModeAtom);
  const resetSelected = useSetAtom(selectedRelationshipIdsAtom);

  const groupContext = useMemo(
    () => ({
      selfSharedId: entity?.sharedId ?? '',
      selfTitle: entity?.title ?? '',
      selfTemplateId: entity?.template ?? '',
      relationshipTypeName: (typeId: string) =>
        relationshipTypes.find(type => type._id === typeId)?.name ?? typeId,
      templateName: (templateId: string) =>
        templates.find(template => template._id === templateId)?.name ?? templateId,
      templateColor: (templateId: string) =>
        templates.find(template => template._id === templateId)?.color,
    }),
    [entity?.sharedId, entity?.title, entity?.template, relationshipTypes, templates]
  );

  useEffect(
    () => () => {
      resetEditMode(false);
      resetSelected(new Set());
    },
    [resetEditMode, resetSelected]
  );

  const lookup = useCallback(
    async (searchString: string) =>
      searchByTitle({
        title: searchString,
        fields: ['title', 'template', 'creationDate', 'sharedId'],
        includeFiles: true,
      }),
    []
  );

  // TODO: Implement view functionality
  const handleRelationshipClick = useCallback(
    (marker: RelationshipMarker) => {
      selectRelationship(marker);
    },
    [selectRelationship]
  );

  const handleViewClick = useCallback((marker: RelationshipMarker) => {
    window.open(`/entity/${marker.target.sharedId}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteClick = useCallback((marker: RelationshipMarker) => {
    setRelationshipToDelete(marker);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!relationshipToDelete?._id || !entity?.sharedId) return;
    setIsDeleting(true);
    try {
      await deleteReference(String(relationshipToDelete._id));
      setRelationshipToDelete(null);
      if (activeRelationshipId === relationshipToDelete._id) {
        clearRelationshipSelection();
      }
      entityLoaderCache.invalidateEntity(entity.sharedId);
      await revalidator.revalidate();
    } catch (error) {
      console.error('Error deleting relationship:', error);
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

  const handleCancelCreate = useCallback(() => {
    setCreateReferenceSelection(undefined, undefined);
  }, [setCreateReferenceSelection]);

  const handleSaveReference = useCallback(
    async (data: {
      selection: TextSelection;
      targetEntityId: string;
      relationshipType: string;
      targetFileId?: string;
      targetSelection?: TextSelection;
    }) => {
      if (!entity) {
        console.error('Cannot save reference: entity is not available');
        return;
      }

      // Get source file ID (main document)
      const sourceFile = mainDocument;
      if (!sourceFile?._id) {
        console.error('Cannot save reference: source file is not available');
        return;
      }

      if (!data.targetEntityId) {
        console.error('Cannot save reference: targetEntityId is not available');
        return;
      }

      try {
        await saveTextReference({
          sourceEntitySharedId: entity.sharedId,
          sourceFileId: String(sourceFile._id),
          sourceSelection: data.selection,
          targetEntitySharedId: data.targetEntityId,
          relationshipType: data.relationshipType,
          ...(data.targetFileId && { targetFileId: data.targetFileId }),
          ...(data.targetSelection && { targetSelection: data.targetSelection }),
        });

        // Clear the create reference selection after successful save
        setCreateReferenceSelection(undefined, undefined);
        // Invalidate cache and revalidate to refresh the entity data and show the new reference
        entityLoaderCache.invalidateEntity(entity.sharedId);
        await revalidator.revalidate();
      } catch (error) {
        console.error('Error saving reference:', error);
        // TODO: Show error notification to user
      }
    },
    [entity, mainDocument, setCreateReferenceSelection, revalidator]
  );

  // If there's a createReferenceSelection, show the CreateReference component
  if (createReferenceSelection) {
    return (
      <CreateReference
        selection={createReferenceSelection}
        relationshipTypes={relationshipTypes}
        searchFunction={lookup}
        mode={createReferenceMode || 'text'}
        onSave={handleSaveReference}
        onCancel={handleCancelCreate}
      />
    );
  }

  // Otherwise, show the references list
  const listBody = (() => {
    if (!hasRelationships) {
      return (
        <BlankState
          icon={
            <LinkIcon className="h-7 w-7 text-ink rounded-full bg-[color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)] p-1" />
          }
          title={<Translate>No Relationships</Translate>}
          description={
            <Translate>To add references you can start by selecting text in the document</Translate>
          }
        />
      );
    }
    if (markers.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-ink-tertiary">
          <Translate>No relationships found</Translate>
        </p>
      );
    }
    return (
      <RelationshipsPanelBody
        markers={markers}
        groupContext={groupContext}
        selfSharedId={entity?.sharedId ?? ''}
        selfTitle={entity?.title ?? ''}
        activeRelationshipId={activeRelationshipId ?? undefined}
        onClick={handleRelationshipClick}
        onView={handleViewClick}
        onDelete={handleDeleteClick}
      />
    );
  })();

  return (
    <>
      <Panel className="overflow-hidden">
        {hasRelationships && (
          <RelationshipsPanelToolbar stats={stats} onOpenFilters={() => setFiltersOpen(true)} />
        )}
        <Panel.Body className="pr-1 pb-2">{listBody}</Panel.Body>
      </Panel>
      {relationshipToDelete && (
        <ConfirmationModal
          header={<Translate>Delete relationship</Translate>}
          body={
            <Translate>
              Are you sure you want to delete this relationship? This action cannot be undone.
            </Translate>
          }
          acceptButton={<Translate>Delete</Translate>}
          cancelButton={<Translate>Cancel</Translate>}
          dangerStyle
          disabled={isDeleting}
          onAcceptClick={handleConfirmDelete}
          onCancelClick={handleCancelDelete}
        />
      )}
    </>
  );
};

export { RelationshipsPanel };
