import React from 'react';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityProvider } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { ShareEntityModal } from '#V2/Routes/Entity/Components/share/index.js';

type LibrarySelectionDialogsProps = {
  dialog: 'delete' | 'permissions' | null;
  count: number;
  deleting: boolean;
  entity?: Entity;
  sharedIds: string[];
  onCancel: () => void;
  onConfirmDelete: () => Promise<void>;
  onClosePermissions: () => void;
};

const deleteTitle = (count: number) =>
  `Delete ${count.toLocaleString()} ${count === 1 ? 'entity' : 'entities'}?`;

const LibrarySelectionDialogs = ({
  dialog,
  count,
  deleting,
  entity,
  sharedIds,
  onCancel,
  onConfirmDelete,
  onClosePermissions,
}: LibrarySelectionDialogsProps) => (
  <>
    {dialog === 'delete' ? (
      <ConfirmationModal
        header={deleteTitle(count)}
        body="Undo restores them until your next delete or bulk change."
        acceptButton="Delete"
        dangerStyle
        disabled={deleting}
        onCancelClick={onCancel}
        onAcceptClick={() => {
          onConfirmDelete().catch(() => undefined);
        }}
      />
    ) : null}
    {dialog === 'permissions' && entity ? (
      <EntityProvider entity={entity}>
        <ShareEntityModal
          key={sharedIds.join('\u0000')}
          sharedIds={sharedIds}
          onClose={onClosePermissions}
        />
      </EntityProvider>
    ) : null}
  </>
);

export type { LibrarySelectionDialogsProps };
export { LibrarySelectionDialogs };
