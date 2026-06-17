import React, { useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { CreateReference } from '../create-reference/CreateReference.js';
import { RelationshipsPanelBody } from './RelationshipsPanelBody.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsPanelToolbarControls } from './RelationshipsPanelToolbarControls.js';
import { RelationshipsSearchBar } from '../filters/RelationshipsSearchBar.js';
import {
  useEntityScopedContext,
  useRelationships,
  useRelationshipsPanelData,
  useRelationshipsPanelFilters,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipSelection } from '#V2/Routes/Entity/Components/document/index.js';
import { useGroupLabelContext } from '../hooks/useGroupLabelContext.js';
import { useRelationshipDelete } from '../hooks/useRelationshipDelete.js';
import { useRelationshipSave } from '../hooks/useRelationshipSave.js';

type RelationshipsPanelProps = {
  mainDocument?: FileType;
  focusDocumentOnSelect?: boolean;
  onFocusDocument?: () => void;
};

const RelationshipsPanel = ({
  mainDocument,
  focusDocumentOnSelect = false,
  onFocusDocument,
}: RelationshipsPanelProps) => {
  const { createReferenceSelection, createReferenceMode } = useRelationships();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useRelationshipSelection();
  const { markers, stats, hasRelationships } = useRelationshipsPanelData();
  const groupContext = useGroupLabelContext();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { view, activeFilterCount, setFiltersDrawerOpen } = useRelationshipsPanelFilters();
  const { setSelectedRelationshipIds, setRelationshipsEditMode } = useEntityScopedContext();

  const {
    relationshipToDelete,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  } = useRelationshipDelete(activeRelationshipId, clearRelationshipSelection);

  const { handleSaveReference, handleCancelCreate } = useRelationshipSave(mainDocument);

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
      if (focusDocumentOnSelect && marker.anchor?.selections?.[0]?.page) {
        onFocusDocument?.();
      }
      selectRelationship(marker, { scrollPanel: true });
    },
    [focusDocumentOnSelect, onFocusDocument, selectRelationship]
  );

  const handleViewClick = useCallback(
    (marker: RelationshipMarker) =>
      window.open(`/entity/${marker.target.sharedId}`, '_blank', 'noopener,noreferrer'),
    []
  );

  useEffect(
    () => () => {
      setRelationshipsEditMode(false);
      setSelectedRelationshipIds(new Set());
    },
    [setRelationshipsEditMode, setSelectedRelationshipIds]
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
        selfSharedId={groupContext.selfSharedId}
        selfTitle={groupContext.selfTitle}
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
              onOpenFilters={() => setFiltersDrawerOpen(true)}
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
