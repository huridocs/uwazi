import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  KeyIcon,
  PencilSquareIcon,
  ShareIcon,
  Square2StackIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';

const iconClassName = 'h-3.5 w-3.5 shrink-0 text-ink-tertiary';
const actionsMenuId = 'library-selection-actions';

type LibraryBulkAction =
  'edit' | 'change-template' | 'export-csv' | 'share' | 'permissions' | 'delete';

type LibraryMultiSelectFooterProps = {
  count: number;
  onClear: () => void;
  onClose: () => void;
  onAction?: (action: LibraryBulkAction) => void;
};

const LibraryMultiSelectFooter = ({
  count,
  onClear,
  onClose,
  onAction,
}: LibraryMultiSelectFooterProps) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const run = (action: LibraryBulkAction) => {
    setActionsOpen(false);
    onAction?.(action);
  };

  return (
    <div
      className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-border bg-paper px-3"
      data-testid="library-multi-select-footer"
    >
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
        <LibraryFooterButton
          icon={<PencilSquareIcon className={iconClassName} />}
          onClick={() => run('edit')}
        >
          <Translate>Edit</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<Square2StackIcon className={iconClassName} />}
          onClick={() => run('change-template')}
        >
          <Translate>Change template</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<ArrowDownTrayIcon className={iconClassName} />}
          onClick={() => run('export-csv')}
        >
          <Translate>Export CSV</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<ShareIcon className={iconClassName} />}
          onClick={() => run('share')}
        >
          <Translate>Share</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<KeyIcon className={iconClassName} />}
          onClick={() => run('permissions')}
        >
          <Translate>Permissions</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<TrashIcon className={iconClassName} />}
          onClick={() => run('delete')}
        >
          <Translate>Delete</Translate>
        </LibraryFooterButton>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="whitespace-nowrap text-xs text-ink-secondary"
          data-testid="library-selected-count"
        >
          {count} <Translate>selected</Translate>
        </span>
        <LibraryFooterButton onClick={onClear}>
          <Translate>Clear</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton onClick={onClose}>
          <Translate>Close</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          icon={<PencilSquareIcon className={iconClassName} />}
          onClick={() => run('edit')}
        >
          <Translate>Edit</Translate>
        </LibraryFooterButton>
        <div className="relative">
          <LibraryFooterButton
            icon={<ChevronDownIcon className={iconClassName} />}
            onClick={() => setActionsOpen(open => !open)}
            expanded={actionsOpen}
            popup="menu"
            controls={actionsMenuId}
          >
            <Translate>Actions</Translate>
          </LibraryFooterButton>
          {actionsOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setActionsOpen(false)}
              />
              <div
                id={actionsMenuId}
                role="menu"
                aria-label="Actions"
                className="absolute bottom-full end-0 z-20 mb-1 min-w-[160px] overflow-hidden rounded-md border border-border bg-paper shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('edit')}
                >
                  <Translate>Edit</Translate>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('change-template')}
                >
                  <Translate>Change template</Translate>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('export-csv')}
                >
                  <Translate>Export CSV</Translate>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('share')}
                >
                  <Translate>Share</Translate>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('permissions')}
                >
                  <Translate>Permissions</Translate>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-start text-xs text-ink-secondary hover:bg-warm"
                  onClick={() => run('delete')}
                >
                  <Translate>Delete</Translate>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export type { LibraryBulkAction, LibraryMultiSelectFooterProps };
export { LibraryMultiSelectFooter };
