import React, { useId, useRef, useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { LibraryFooterMenu } from './LibraryFooterMenu.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import { editorRoles, menuItemClassName } from './libraryResultsFooterActions.js';

const triggerClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm hover:text-ink sm:px-3';

type LibrarySelectionActionsMenuProps = {
  onAction?: (action: LibraryBulkAction) => void;
};

const LibrarySelectionActionsMenu = ({ onAction }: LibrarySelectionActionsMenuProps) => {
  const permissions = librarySelectionActions().find(action => action.id === 'permissions');
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  if (!permissions) {
    return null;
  }
  return (
    <NeedAuthorization roles={editorRoles}>
      <button
        ref={ref}
        type="button"
        aria-label={t('System', 'Actions', null, false)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(current => !current)}
        className={triggerClassName}
      >
        <span className="text-ink-tertiary">
          <LibrarySelectionIcon name="more-horizontal" size={13} />
        </span>
        <span className="sm:inline">
          <Translate>Actions</Translate>
        </span>
        <ChevronUpIcon className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />
      </button>
      <LibraryFooterMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        label={t('System', 'Actions', null, false)}
        menuId={menuId}
        prefer="start"
      >
        <button
          type="button"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => {
            setOpen(false);
            onAction?.(permissions.id);
          }}
        >
          {permissions.icon}
          <Translate>{permissions.label}</Translate>
        </button>
      </LibraryFooterMenu>
    </NeedAuthorization>
  );
};

export { LibrarySelectionActionsMenu };
