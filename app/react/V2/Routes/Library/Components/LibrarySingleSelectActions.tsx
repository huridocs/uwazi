import React, { type ReactNode } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibraryFooterDivider } from './LibraryFooterDivider.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';

const textButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-warm';

const iconButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-warm hover:text-ink';

const deleteButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-seal transition-colors hover:bg-seal-tint';

type LibrarySingleSelectActionsProps = {
  entityBasePath?: string;
  sharedId?: string;
  onAction?: (action: LibraryBulkAction) => void;
  onEdit?: () => void;
  onClose: () => void;
  leading?: ReactNode;
  includeViewEntity?: boolean;
};

const actionById = (id: LibraryBulkAction) =>
  librarySelectionActions().find(action => action.id === id);

const LibrarySingleSelectActions = ({
  entityBasePath,
  sharedId,
  onAction,
  onEdit,
  onClose,
  leading,
  includeViewEntity = true,
}: LibrarySingleSelectActionsProps) => (
  <>
    <div className="flex min-w-0 items-center gap-2">
      <div data-testid="library-single-select-actions" className="flex shrink-0 items-center">
        <LibraryFooterButton onClick={() => onEdit?.()}>
          <Translate>Edit</Translate>
        </LibraryFooterButton>
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
          className={deleteButtonClassName}
        >
          {actionById('delete')?.icon}
        </button>
      </div>
      {leading}
    </div>
    <div className="ms-auto flex shrink-0 items-center">
      <button
        type="button"
        onClick={onClose}
        className={`${textButtonClassName} text-ink-secondary hover:text-ink`}
      >
        <Translate>Close</Translate>
      </button>
      {includeViewEntity && entityBasePath && sharedId ? (
        <I18NLinkV2
          to={`${entityBasePath}/${sharedId}`}
          className="ms-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-parchment transition-colors hover:bg-ink-70"
        >
          <Translate>View entity</Translate>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </I18NLinkV2>
      ) : null}
    </div>
  </>
);

export type { LibrarySingleSelectActionsProps };
export { LibrarySingleSelectActions };
