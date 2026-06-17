import React, { useCallback, useMemo, useState } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, ConfirmationModal } from '#V2/Components/UI/index.js';
import { countEntityRelationships } from '#V2/formatters/index.js';
import { useRelationshipSelection } from '../useRelationshipSelection.js';
import { useRelationshipBulkDelete } from './useRelationshipBulkDelete.js';
import { useEntityScopedContext, useEntityScopedEntity } from '../EntityScopedProvider.js';

const RelationshipsActionBar = () => {
  const entity = useEntityScopedEntity();
  const {
    relationshipsEditMode: editMode,
    setRelationshipsEditMode: setEditMode,
    selectedRelationshipIds: selected,
    setSelectedRelationshipIds: setSelected,
  } = useEntityScopedContext();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { activeRelationshipId, clearRelationshipSelection } = useRelationshipSelection();

  const totalCount = useMemo(() => (entity ? countEntityRelationships(entity) : 0), [entity]);
  const selectedCount = selected.size;
  const hasSelection = selectedCount > 0;

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setConfirmDelete(false);
  }, [setSelected]);

  const { isDeleting, deleteSelected } = useRelationshipBulkDelete(selected, () => {
    if (activeRelationshipId && selected.has(activeRelationshipId)) {
      clearRelationshipSelection();
    }
    clearSelection();
  });

  const cancelEdit = useCallback(() => {
    setSelected(new Set());
    setEditMode(false);
  }, [setEditMode, setSelected]);

  const saveEdit = useCallback(() => {
    setEditMode(false);
  }, [setEditMode]);

  const handleConfirmDelete = useCallback(async () => {
    await deleteSelected();
  }, [deleteSelected]);

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2">
        {!editMode ? (
          <Button
            variant="secondary"
            size="small"
            className="inline-flex items-center gap-1.5"
            onClick={() => setEditMode(true)}
          >
            <PencilIcon className="h-3 w-3" />
            <Translate>Edit</Translate>
          </Button>
        ) : (
          <span />
        )}
        {editMode && (
          <div className="flex items-center gap-2">
            {hasSelection && (
              <>
                <span className="text-xs text-ink-secondary">
                  <Translate>Selected</Translate> {selectedCount} <Translate>of</Translate>{' '}
                  {totalCount}
                </span>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                >
                  <Translate>Delete</Translate>
                </Button>
              </>
            )}
            <Button variant="secondary" size="small" onClick={cancelEdit} disabled={isDeleting}>
              <Translate>Cancel</Translate>
            </Button>
            <Button variant="primary" size="small" onClick={saveEdit} disabled={isDeleting}>
              <Translate>Save</Translate>
            </Button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmationModal
          header={
            selectedCount === 1 ? (
              <Translate>Delete relationship</Translate>
            ) : (
              <Translate>Delete relationships</Translate>
            )
          }
          body={
            selectedCount === 1 ? (
              <Translate>
                Are you sure you want to delete this relationship? This action cannot be undone.
              </Translate>
            ) : (
              <span>
                <Translate>Are you sure you want to delete</Translate> {selectedCount}{' '}
                <Translate>relationships? This action cannot be undone.</Translate>
              </span>
            )
          }
          acceptButton={<Translate>Delete</Translate>}
          cancelButton={<Translate>Cancel</Translate>}
          dangerStyle
          disabled={isDeleting}
          onAcceptClick={handleConfirmDelete}
          onCancelClick={() => !isDeleting && setConfirmDelete(false)}
        />
      )}
    </>
  );
};

export { RelationshipsActionBar };
