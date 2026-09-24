import React, { type ReactNode } from 'react';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import type { LibrarySelectionIconName } from './librarySelectionIcons.js';

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

const librarySelectionMenuActions = (): LibrarySelectionAction[] =>
  librarySelectionActions().filter(action => action.id !== 'edit');

export type { LibraryBulkAction, LibrarySelectionAction };
export { librarySelectionActions, librarySelectionMenuActions };
