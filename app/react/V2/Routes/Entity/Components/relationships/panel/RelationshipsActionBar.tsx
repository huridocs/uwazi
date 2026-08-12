import React, { useCallback, useMemo, useState } from 'react';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { GitForkIcon } from '#V2/Components/CustomIcons/index.js';
import {
  Button,
  ConfirmationModal,
  NeedAuthorization,
  SelectControls,
} from '#V2/Components/UI/index.js';
import { useActiveRelationshipHighlight } from '#V2/Routes/Entity/Components/document/index.js';
import {
  EntityWriteAuthorization,
  useDocumentPdf,
  useRelationshipsActions,
  useRelationshipsSelection,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityTabNavigation } from '#V2/Routes/Entity/Tabs/hooks/useEntityTabNavigation.js';
import { useRelationshipBulkDelete } from '../hooks/useRelationshipBulkDelete.js';
import { useEntityRelationshipMarkers } from '../hooks/useDocumentRelationships.js';

const iconClass = 'h-3 w-3 shrink-0';

const RelationshipsActionBar = () => {
  const sourceMarkers = useEntityRelationshipMarkers();
  const {
    relationshipsEditMode: editMode,
    setRelationshipsEditMode: setEditMode,
    selectedRelationshipIds: selected,
    setSelectedRelationshipIds: setSelected,
  } = useRelationshipsSelection();
  const { openCreateRelationship } = useRelationshipsActions();
  const { documentPdfSelection } = useDocumentPdf();
  const { focusRelationshipsPanel } = useEntityTabNavigation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { activeRelationshipId, clearRelationshipSelection } = useActiveRelationshipHighlight();

  const totalCount = sourceMarkers.length;
  const selectedCount = selected.size;
  const hasSelection = selectedCount > 0;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const allIds = useMemo(() => sourceMarkers.map(marker => marker._id), [sourceMarkers]);

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

  const handleCreate = useCallback(() => {
    openCreateRelationship(documentPdfSelection);
    focusRelationshipsPanel();
  }, [documentPdfSelection, focusRelationshipsPanel, openCreateRelationship]);

  return (
    <EntityWriteAuthorization>
      <div className="flex w-full items-center justify-between gap-2">
        {!editMode ? (
          <Button
            variant="warm"
            className="inline-flex items-center"
            onClick={() => setEditMode(true)}
          >
            <PencilIcon className={iconClass} />
            <Translate>Edit</Translate>
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="warm" className="inline-flex items-center" onClick={handleCreate}>
              <PlusIcon className={iconClass} />
              <Translate>Create relationship</Translate>
            </Button>
            <NeedAuthorization roles={['admin']}>
              <I18NLinkV2
                to="/settings/relationship-types"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm hover:text-ink"
              >
                <GitForkIcon className={`${iconClass} text-ink-tertiary`} />
                <Translate>Manage types</Translate>
              </I18NLinkV2>
            </NeedAuthorization>
            <SelectControls
              allSelected={allSelected}
              hasSelection={hasSelection}
              totalCount={totalCount}
              onSelectAll={() => setSelected(new Set(allIds))}
              onDeselectAll={() => setSelected(new Set())}
            />
          </div>
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
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                >
                  <Translate>Delete</Translate>
                </Button>
              </>
            )}
            <Button variant="warm" onClick={cancelEdit} disabled={isDeleting}>
              <Translate>Cancel</Translate>
            </Button>
            <Button variant="primary" onClick={saveEdit} disabled={isDeleting}>
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
    </EntityWriteAuthorization>
  );
};

export { RelationshipsActionBar };
