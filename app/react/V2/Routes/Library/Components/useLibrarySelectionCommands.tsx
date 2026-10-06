import React, { useState } from 'react';
import { useRevalidator } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { ApiError } from '#shared/apiClient/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { Entity } from '#V2/api/entities/types.js';
import { useServices } from '#V2/services/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibrarySelectionDialogs } from './LibrarySelectionDialogs.js';

const entityForShare = (
  rows: readonly LibrarySearchHit[],
  sharedId: string | undefined
): Entity | undefined => {
  if (!sharedId) {
    return undefined;
  }
  const hit = rows.find(row => row.sharedId === sharedId);
  return {
    _id: hit?._id ?? sharedId,
    sharedId,
    title: hit?.title ?? '',
    template: hit?.template ?? '',
    language: hit?.language ?? 'en',
    creationDate: hit?.creationDate ?? 0,
    user: '',
    published: hit?.published,
    metadata: {},
  };
};

const notifyDeleted = (error: ApiError | undefined, count: number) => {
  if (error) {
    notify(
      t('System', 'An error occurred', null, false),
      'error',
      undefined,
      error.detail ?? error.message
    );
    return false;
  }
  notify(t('System', count === 1 ? 'Entity deleted' : 'Entities deleted', null, false), 'success');
  return true;
};

const runSelectionDelete = async (
  remove: (sharedIds: string[]) => Promise<ApiResponse<void>>,
  ids: string[]
) => {
  const [, error] = await remove(ids);
  return notifyDeleted(error, ids.length);
};

const useLibrarySelectionCommands = (
  selectedIds: readonly string[],
  rows: readonly LibrarySearchHit[],
  onDeleted: () => void
) => {
  const { entities } = useServices();
  const revalidator = useRevalidator();
  const [dialog, setDialog] = useState<'delete' | 'permissions' | null>(null);
  const [frozenIds, setFrozenIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const open = (next: 'delete' | 'permissions') => {
    setFrozenIds([...selectedIds]);
    setDialog(next);
  };

  const onAction = (action: LibraryBulkAction) => {
    if (action === 'delete' || action === 'permissions') {
      open(action);
    }
  };

  const confirmDelete = async () => {
    if (deleting || frozenIds.length === 0) {
      return;
    }
    setDeleting(true);
    try {
      const deleted = await runSelectionDelete(
        async sharedIds => entities.delete(sharedIds),
        frozenIds
      );
      if (deleted) {
        setDialog(null);
        onDeleted();
        void revalidator.revalidate();
      }
    } finally {
      setDeleting(false);
    }
  };

  const dialogs = (
    <LibrarySelectionDialogs
      dialog={dialog}
      count={frozenIds.length}
      deleting={deleting}
      entity={entityForShare(rows, frozenIds[0])}
      sharedIds={frozenIds}
      onCancel={() => {
        if (!deleting) setDialog(null);
      }}
      onConfirmDelete={confirmDelete}
      onClosePermissions={() => setDialog(null)}
    />
  );

  return { onAction, dialogs };
};

export { useLibrarySelectionCommands };
