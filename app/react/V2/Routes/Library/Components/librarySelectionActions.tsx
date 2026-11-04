import React, { type ReactNode } from 'react';
import { t } from '#app/I18N/index.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import type { LibrarySelectionIconName } from './librarySelectionIcons.js';

/** Matches POST /api/entities/bulkdelete. Selections at this size cannot be deleted. */
const BULK_DELETE_LIMIT = 10_000;

const deleteExceedsBulkLimit = (count: number) => count >= BULK_DELETE_LIMIT;

const bulkDeleteLimitTitle = () =>
  t('System', 'You can delete at most 10,000 entities at once.', null, false);

/** Selection actions. Share is Permissions. Change template is not a library action. */
type LibraryBulkAction = 'edit' | 'export' | 'permissions' | 'delete';

type LibrarySelectionAction = {
  id: LibraryBulkAction;
  label: string;
  icon: ReactNode;
  danger?: boolean;
};

const actionIcon = (name: LibrarySelectionIconName) => (
  <LibrarySelectionIcon name={name} size={13} />
);

const librarySelectionActions = (): LibrarySelectionAction[] => [
  { id: 'edit', label: 'Edit', icon: actionIcon('pen-line') },
  { id: 'export', label: 'Export CSV', icon: actionIcon('file-down') },
  { id: 'permissions', label: 'Permissions', icon: actionIcon('lock') },
  { id: 'delete', label: 'Delete', icon: actionIcon('trash'), danger: true },
];

export type { LibraryBulkAction, LibrarySelectionAction };
export { BULK_DELETE_LIMIT, bulkDeleteLimitTitle, deleteExceedsBulkLimit, librarySelectionActions };
