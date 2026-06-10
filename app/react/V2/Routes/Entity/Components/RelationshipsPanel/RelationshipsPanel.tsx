import React, { useState, useCallback, useMemo } from 'react';
import { useRevalidator } from 'react-router';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { formatRelationships } from '#V2/formatters/index.js';
import { deleteReference, saveTextReference } from '#V2/api/relationships/index.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import { RelationshipMarker, toMarker } from '#V2/Components/Relationships/types.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { CreateReference } from './CreateReference.js';
import { RelationshipRow } from './RelationshipRow.js';
import { useRelationships, useRelationshipsActions } from './relationshipsAtom.js';
import { useRelationshipSelection } from '../useRelationshipSelection.js';

type RelationshipsPanelProps = {
  entity?: Entity;
  mainDocument?: FileType;
};

// eslint-disable-next-line max-statements
const RelationshipsPanel = ({ entity, mainDocument }: RelationshipsPanelProps) => {
  const [relationshipToDelete, setRelationshipToDelete] = useState<RelationshipMarker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { createReferenceSelection, createReferenceMode } = useRelationships();
  const { setCreateReferenceSelection } = useRelationshipsActions();
  const revalidator = useRevalidator();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useRelationshipSelection();
  const relationships = useMemo<RelationshipMarker[]>(
    () => (entity ? formatRelationships(entity).map(view => toMarker(view, entity.sharedId)) : []),
    [entity]
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

  const handleRelationshipClick = useCallback(
    (marker: RelationshipMarker) => {
      selectRelationship(marker);
    },
    [selectRelationship]
  );

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

        setCreateReferenceSelection(undefined, undefined);
        entityLoaderCache.invalidateEntity(entity.sharedId);
        await revalidator.revalidate();
      } catch (error) {
        console.error('Error saving reference:', error);
      }
    },
    [entity, mainDocument, setCreateReferenceSelection, revalidator]
  );

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

  return (
    <>
      <Panel>
        <Panel.Body className="pr-1">
          <div className="flex flex-col gap-(--spacing-theme-3) h-full">
            {relationships.length > 0 ? (
              relationships.map((marker, index) => (
                <RelationshipRow
                  key={marker._id || `relationship-${index}`}
                  marker={marker}
                  isSelected={activeRelationshipId === marker._id}
                  onClick={() => handleRelationshipClick(marker)}
                  onDelete={() => handleDeleteClick(marker)}
                />
              ))
            ) : (
              <BlankState
                icon={
                  <LinkIcon className="h-7 w-7 text-ink rounded-full bg-[color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)] p-1" />
                }
                title={<Translate>No Relationships</Translate>}
                description={
                  <Translate>
                    To add references you can start by selecting text in the document
                  </Translate>
                }
              />
            )}
          </div>
        </Panel.Body>

        <Panel.Footer>
          <div className="flex items-center justify-between w-full" />
        </Panel.Footer>
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
