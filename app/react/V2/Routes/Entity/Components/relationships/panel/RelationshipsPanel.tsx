/* eslint-disable react/no-multi-comp */
import React, { useCallback, useEffect } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { ConfirmationModal, BlankState } from '#V2/Components/UI/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { RelationshipsPanelBody } from './RelationshipsPanelBody.js';
import { RelationshipsListInfoRow } from './RelationshipsListInfoRow.js';
import { RelationshipsSearchBar } from '../filters/RelationshipsSearchBar.js';
import {
  useRelationshipsPanelData,
  useRelationshipsPanelLayout,
  useRelationshipsSelectionActions,
  useEntityOverlay,
  useEntityWriteAuthorized,
  useEnsureResolved,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useActiveRelationshipHighlight } from '#V2/Routes/Entity/Components/document/index.js';
import { useGroupLabelContext } from '../hooks/useGroupLabelContext.js';
import { useRelationshipDelete } from '../hooks/useRelationshipDelete.js';
import { useSsrOnlyContent } from '../hooks/useSsrOnlyContent.js';
import { RelationshipsSsrIndex } from './RelationshipsSsrIndex.js';

type RelationshipsPanelProps = {
  focusDocumentOnSelect?: boolean;
  onFocusDocument?: () => void;
};

const RelationshipsPanelView = ({
  focusDocumentOnSelect = false,
  onFocusDocument,
}: RelationshipsPanelProps) => {
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useActiveRelationshipHighlight();
  const { markers, stats, hasRelationships } = useRelationshipsPanelData();
  const groupContext = useGroupLabelContext();
  const { view } = useRelationshipsPanelLayout();
  const { setSelectedRelationshipIds, setRelationshipsEditMode } =
    useRelationshipsSelectionActions();
  const canWrite = useEntityWriteAuthorized();

  const { openEntityOverlay } = useEntityOverlay();
  const ensureResolved = useEnsureResolved();
  const {
    relationshipToDelete,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  } = useRelationshipDelete(activeRelationshipId, clearRelationshipSelection);

  useEffect(() => {
    ensureResolved().catch(() => undefined);
  }, [ensureResolved]);

  const handleRelationshipClick = useCallback(
    (marker: RelationshipMarker) => {
      if (focusDocumentOnSelect && marker.anchor?.selections?.[0]?.page) {
        onFocusDocument?.();
      }
      selectRelationship(marker, { scrollPanel: true }).catch(() => undefined);
    },
    [focusDocumentOnSelect, onFocusDocument, selectRelationship]
  );

  const handleViewClick = useCallback(
    (marker: RelationshipMarker) => openEntityOverlay(marker),
    [openEntityOverlay]
  );

  useEffect(
    () => () => {
      setRelationshipsEditMode(false);
      setSelectedRelationshipIds(new Set());
    },
    [setRelationshipsEditMode, setSelectedRelationshipIds]
  );

  const renderBody = () => {
    if (!hasRelationships) {
      return (
        <BlankState
          icon={
            <LinkIcon className="h-7 w-7 text-ink rounded-full bg-[color-mix(in_srgb,var(--color-theme-border-default)_70%,transparent)] p-1" />
          }
          title={<Translate>No Relationships</Translate>}
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
        activeRelationshipId={activeRelationshipId ?? undefined}
        onClick={handleRelationshipClick}
        onView={handleViewClick}
        onDelete={canWrite ? handleDeleteClick : undefined}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col [&_.panel]:h-full [&_.panel]:border-0">
      <Panel className="overflow-hidden">
        {hasRelationships && (
          <div className="flex shrink-0 flex-col gap-2 border-b border-border/50 pb-2 pt-1">
            <RelationshipsSearchBar />
            {view !== 'graph' && <RelationshipsListInfoRow stats={stats} />}
          </div>
        )}
        <Panel.Body
          className={view === 'graph' ? 'flex min-h-0 flex-col overflow-hidden! pr-1' : 'pr-1 pb-2'}
        >
          {renderBody()}
        </Panel.Body>
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

const RelationshipsPanel = ({
  focusDocumentOnSelect,
  onFocusDocument,
}: RelationshipsPanelProps) => {
  const showSsrIndex = useSsrOnlyContent();

  if (showSsrIndex) {
    return <RelationshipsSsrIndex />;
  }

  return (
    <RelationshipsPanelView
      focusDocumentOnSelect={focusDocumentOnSelect}
      onFocusDocument={onFocusDocument}
    />
  );
};

export { RelationshipsPanel };
