import React, { type ReactNode } from 'react';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import type { LibrarySelectionIconName } from './librarySelectionIcons.js';

/** uwazi-design `useSelectionActions` order, without Share. */
type LibraryBulkAction = 'edit' | 'change-template' | 'export' | 'permissions' | 'delete';

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
  { id: 'change-template', label: 'Change template', icon: actionIcon('layout-template') },
  { id: 'export', label: 'Export CSV', icon: actionIcon('file-down') },
  { id: 'permissions', label: 'Permissions', icon: actionIcon('lock') },
  { id: 'delete', label: 'Delete', icon: actionIcon('trash'), danger: true },
];

export type { LibraryBulkAction, LibrarySelectionAction };
export { librarySelectionActions };
