import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { LibraryFooterDivider } from './LibraryFooterDivider.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';

const textButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-warm';

const iconButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-warm hover:text-ink';

type LibrarySingleSelectActionsProps = {
  entityBasePath: string;
  sharedId: string;
  onAction?: (action: LibraryBulkAction) => void;
  onClose: () => void;
};

const actionById = (id: LibraryBulkAction) =>
  librarySelectionActions().find(action => action.id === id);

const LibrarySingleSelectActions = ({
  entityBasePath,
  sharedId,
  onAction,
  onClose,
}: LibrarySingleSelectActionsProps) => (
  <div data-testid="library-single-select-actions" className="ms-auto flex shrink-0 items-center">
    <button
      type="button"
      aria-label="Edit"
      onClick={() => onAction?.('edit')}
      className={`${textButtonClassName} text-ink`}
    >
      <span className="text-ink-tertiary">{actionById('edit')?.icon}</span>
      <span className="sm:inline">
        <Translate>Edit</Translate>
      </span>
    </button>
    <LibraryFooterDivider />
    <button
      type="button"
      aria-label="Permissions"
      onClick={() => onAction?.('permissions')}
      className={iconButtonClassName}
    >
      {actionById('permissions')?.icon}
    </button>
    <LibraryFooterDivider />
    <button
      type="button"
      aria-label="Delete"
      onClick={() => onAction?.('delete')}
      className={iconButtonClassName}
    >
      {actionById('delete')?.icon}
    </button>
    <LibraryFooterDivider />
    <button
      type="button"
      onClick={onClose}
      className={`${textButtonClassName} text-ink-secondary hover:text-ink`}
    >
      <Translate>Close</Translate>
    </button>
    <I18NLinkV2
      to={`${entityBasePath}/${sharedId}`}
      className="ms-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-parchment transition-colors hover:bg-ink-70"
    >
      <Translate>View entity</Translate>
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </I18NLinkV2>
  </div>
);

export type { LibrarySingleSelectActionsProps };
export { LibrarySingleSelectActions };
