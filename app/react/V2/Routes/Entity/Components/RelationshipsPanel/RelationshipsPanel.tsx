import React, { useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { CreateReference } from './CreateReference.js';
import { RelationshipsPanelBody } from './RelationshipsPanelBody.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsPanelToolbarControls } from './RelationshipsPanelToolbarControls.js';
import { RelationshipsSearchBar } from './RelationshipsSearchBar.js';
import {
  useRelationships,
  relationshipsEditModeAtom,
  selectedRelationshipIdsAtom,
} from './relationshipsAtom.js';
import {
  relationshipsPanelActiveFilterCountAtom,
  relationshipsPanelFiltersDrawerOpenAtom,
  relationshipsPanelViewAtom,
} from './relationshipsPanelFiltersAtom.js';
import { useRelationshipSelection } from '../useRelationshipSelection.js';
import { useRelationshipsPanelData } from './useRelationshipsPanelData.js';
import { useGroupLabelContext } from './useGroupLabelContext.js';
import { useRelationshipDelete } from './useRelationshipDelete.js';
import { useRelationshipSave } from './useRelationshipSave.js';
import { useEntityTabNavigation } from '../../Tabs/hooks/useEntityTabNavigation.js';

type RelationshipsPanelProps = {
  entity?: Entity;
  mainDocument?: FileType;
};

const RelationshipsPanel = ({ entity, mainDocument }: RelationshipsPanelProps) => {
  const { createReferenceSelection, createReferenceMode } = useRelationships();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useRelationshipSelection();
  const { markers, stats, hasRelationships } = useRelationshipsPanelData();
  const groupContext = useGroupLabelContext(entity);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const view = useAtomValue(relationshipsPanelViewAtom);
  const activeFilterCount = useAtomValue(relationshipsPanelActiveFilterCountAtom);
  const setFiltersOpen = useSetAtom(relationshipsPanelFiltersDrawerOpenAtom);
  const { focusDocumentPanel, relationshipsOnMain } = useEntityTabNavigation();
  const resetSelected = useSetAtom(selectedRelationshipIdsAtom);
  const resetEditMode = useSetAtom(relationshipsEditModeAtom);

  const {
    relationshipToDelete,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  } = useRelationshipDelete(entity, activeRelationshipId, clearRelationshipSelection);

  const { handleSaveReference, handleCancelCreate } = useRelationshipSave(entity, mainDocument);

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
      if (relationshipsOnMain && marker.anchor?.selections?.[0]?.page) {
        focusDocumentPanel();
      }
      selectRelationship(marker, { scrollPanel: true });
    },
    [focusDocumentPanel, relationshipsOnMain, selectRelationship]
  );

  const handleViewClick = useCallback(
    (marker: RelationshipMarker) =>
      window.open(`/entity/${marker.target.sharedId}`, '_blank', 'noopener,noreferrer'),
    []
  );

  useEffect(
    () => () => {
      resetEditMode(false);
      resetSelected(new Set());
    },
    [resetEditMode, resetSelected]
  );

  if (createReferenceSelection) {
    return (
      <div className="flex h-full min-h-0 flex-col [&_.panel]:h-full [&_.panel]:border-0">
        <CreateReference
          selection={createReferenceSelection}
          relationshipTypes={relationshipTypes}
          searchFunction={lookup}
          mode={createReferenceMode || 'text'}
          onSave={handleSaveReference}
          onCancel={handleCancelCreate}
        />
      </div>
    );
  }

  const renderBody = () => {
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
  };

  return (
    <div className="flex h-full min-h-0 flex-col [&_.panel]:h-full [&_.panel]:border-0">
      <Panel className="overflow-hidden">
        {hasRelationships && (
          <div className="flex shrink-0 flex-col gap-2 border-b border-border/50 pb-2 pt-1">
            <RelationshipsSearchBar />
            <RelationshipsPanelToolbarControls
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            {view !== 'graph' && <RelationshipsListInfoRow stats={stats} />}
          </div>
        )}
        <Panel.Body className="pr-1 pb-2">{renderBody()}</Panel.Body>
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
    </div>
  );
};

export { RelationshipsPanel };
