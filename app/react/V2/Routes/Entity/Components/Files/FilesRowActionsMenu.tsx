import React from 'react';
import { Menu } from '@headlessui/react';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityFileRow } from './types.js';

type FilesRowActionsMenuProps = {
  row: EntityFileRow;
  onView: (row: EntityFileRow) => void;
  onEdit: (row: EntityFileRow) => void;
  onDelete: (row: EntityFileRow) => void;
  onAddTranslation?: (row: EntityFileRow) => void;
};

const menuItemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-warm';

const FilesRowActionsMenu = ({
  row,
  onView,
  onEdit,
  onDelete,
  onAddTranslation,
}: FilesRowActionsMenuProps) => (
  <Menu as="div" className="relative inline-flex">
    <Menu.Button
      type="button"
      className="rounded p-1 text-ink-secondary hover:bg-warm"
      aria-label="File actions"
    >
      <EllipsisVerticalIcon className="h-5 w-5" />
    </Menu.Button>
    <Menu.Items className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-md border border-border-soft bg-paper shadow-sm">
      <Menu.Item>
        <button type="button" className={menuItemClass} onClick={() => onView(row)}>
          <EyeIcon className="h-4 w-4" />
          <Translate>View</Translate>
        </button>
      </Menu.Item>
      <Menu.Item>
        <button type="button" className={menuItemClass} onClick={() => onEdit(row)}>
          <PencilIcon className="h-4 w-4" />
          <Translate>Edit</Translate>
        </button>
      </Menu.Item>
      {onAddTranslation && row.category === 'primary' && (
        <Menu.Item>
          <button type="button" className={menuItemClass} onClick={() => onAddTranslation(row)}>
            <PlusIcon className="h-4 w-4" />
            <Translate>Add translation</Translate>
          </button>
        </Menu.Item>
      )}
      <Menu.Item>
        <button type="button" className={menuItemClass} onClick={() => onDelete(row)}>
          <TrashIcon className="h-4 w-4" />
          <Translate>Delete</Translate>
        </button>
      </Menu.Item>
    </Menu.Items>
  </Menu>
);

export { FilesRowActionsMenu };
