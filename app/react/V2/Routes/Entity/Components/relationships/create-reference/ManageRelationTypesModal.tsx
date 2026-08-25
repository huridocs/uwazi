import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { PlusStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import {
  useRelationships,
  useRelationshipsActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useServices } from '#V2/services/index.js';
import { useRelationshipTypeMutations } from '#V2/services/useRelationshipTypeMutations.js';
import { RelationshipTypeRow } from './RelationshipTypeRow.js';

const typeInputClassName =
  'flex-1 rounded-md border border-border bg-warm px-3 py-2 text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-carbon/20';

const ManageRelationTypesModal = () => {
  const { manageRelationTypesOpen } = useRelationships();
  const { closeManageRelationTypes } = useRelationshipsActions();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { relationshipTypes: relationshipTypesService } = useServices();
  const { create, delete: deleteType } = useRelationshipTypeMutations();
  const { notify } = useRequestStatus();
  const [draftName, setDraftName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
  const [duplicateError, setDuplicateError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refCounts, setRefCounts] = useState<{ [id: string]: number | undefined }>({});

  const idsKey = relationshipTypes.map(relationshipType => relationshipType._id).join(',');

  const inUseIds = useMemo(() => {
    const ids = new Set<string>();
    templates.forEach(template => {
      template.properties?.forEach(property => {
        if (property.relationType) {
          ids.add(property.relationType);
        }
      });
    });
    return ids;
  }, [templates]);

  useEffect(() => {
    if (!manageRelationTypesOpen) {
      setRefCounts({});
      return undefined;
    }
    const controller = new AbortController();
    const ids = idsKey === '' ? [] : idsKey.split(',');
    const loadCounts = async () => {
      const [counts] = await relationshipTypesService.countByTypes(ids, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted && counts) {
        setRefCounts(counts);
      }
    };
    loadCounts().catch(() => undefined);
    return () => {
      controller.abort();
    };
  }, [manageRelationTypesOpen, idsKey, relationshipTypesService]);

  const handleClose = useCallback(() => {
    setDraftName('');
    setPendingDeleteId(undefined);
    setDuplicateError(false);
    closeManageRelationTypes();
  }, [closeManageRelationTypes]);

  const handleAdd = useCallback(async () => {
    if (!draftName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const result = await create(draftName);
      if (result.status === 'duplicate') {
        setDuplicateError(true);
        return;
      }
      if (result.status === 'error') {
        notify('error', result.message);
        return;
      }
      notify(
        'success',
        t('System', 'Added relation type "{name}"', null, false).replace('{name}', result.type.name)
      );
      setDraftName('');
      setDuplicateError(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        notify('error', error.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [create, draftName, isSaving, notify]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteType(id);
      if (result.status === 'error') {
        notify('error', result.message);
        return;
      }
      setPendingDeleteId(undefined);
    },
    [deleteType, notify]
  );

  if (!manageRelationTypesOpen) return null;
  return (
    <Modal size="lg" ariaLabel={t('System', 'Manage relationship types', null, false)}>
      <Modal.Header>
        <div>
          <h3 className="text-base font-semibold text-ink">
            <Translate>Manage relationship types</Translate>
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            <Translate>Add or remove relationship types for this collection.</Translate>
          </p>
        </div>
        <Modal.CloseButton onClick={handleClose} />
      </Modal.Header>
      <Modal.Body className="space-y-1">
        {relationshipTypes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-ink-secondary">
              <Translate>No relationship types</Translate>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              <Translate>Add a type below.</Translate>
            </p>
          </div>
        ) : (
          relationshipTypes.map(relationshipType => (
            <RelationshipTypeRow
              key={relationshipType._id}
              name={relationshipType.name}
              inUse={inUseIds.has(relationshipType._id)}
              count={refCounts[relationshipType._id]}
              confirming={pendingDeleteId === relationshipType._id}
              onAskDelete={() => setPendingDeleteId(relationshipType._id)}
              onCancelDelete={() => setPendingDeleteId(undefined)}
              onConfirmDelete={async () => {
                await handleDelete(relationshipType._id).catch(error => {
                  notify('error', error.message);
                });
              }}
            />
          ))
        )}
      </Modal.Body>
      <Modal.Footer className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draftName}
            onChange={event => {
              setDraftName(event.target.value);
              setDuplicateError(false);
            }}
            onKeyDown={async event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                await handleAdd();
              }
            }}
            placeholder={t('System', 'New relation type label…', null, false)}
            className={typeInputClassName}
          />
          <Button
            variant="primary"
            className="inline-flex items-center gap-1"
            onClick={handleAdd}
            disabled={!draftName.trim() || isSaving}
          >
            <PlusStrokeIcon className="h-3 w-3" aria-hidden="true" />
            <Translate>Add</Translate>
          </Button>
        </div>
        {duplicateError ? (
          <p className="text-xs text-seal">
            <Translate>Already exists</Translate>
          </p>
        ) : null}
      </Modal.Footer>
    </Modal>
  );
};

export { ManageRelationTypesModal };
