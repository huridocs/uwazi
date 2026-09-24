import React, { useEffect, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { librarySelectionMenuActions } from './librarySelectionActions.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';

type LibrarySelectionActionsMenuProps = {
  onAction?: (action: LibraryBulkAction) => void;
};

const menuItem = (action: LibrarySelectionAction, onClick: () => void) => (
  <button
    key={action.id}
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-start text-xs hover:bg-warm ${
      action.danger ? 'text-seal-label' : 'text-ink'
    }`}
  >
    <span className={action.danger ? '' : 'text-ink-tertiary'} aria-hidden>
      {action.icon}
    </span>
    <span className="sm:inline">
      <Translate>{action.label}</Translate>
    </span>
  </button>
);

const LibrarySelectionActionsMenu = ({ onAction }: LibrarySelectionActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const actions = librarySelectionMenuActions();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointer = (event: MouseEvent) => {
      const { target } = event;
      if (!(target instanceof Node) || rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className="inline-flex shrink-0 cursor-pointer items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-warm"
      >
        <Translate>Actions</Translate>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Selection actions"
          className="absolute inset-e-0 bottom-full z-20 mb-1 min-w-44 rounded-md border border-border bg-paper py-1 shadow-lg"
        >
          {actions.flatMap(action => {
            const item = menuItem(action, () => {
              setOpen(false);
              onAction?.(action.id);
            });
            if (!action.danger) {
              return [item];
            }
            return [
              <hr
                key={`${action.id}-separator`}
                className="mx-2 my-1 h-px border-0 bg-border-soft"
              />,
              item,
            ];
          })}
        </div>
      ) : null}
    </div>
  );
};

export type { LibrarySelectionActionsMenuProps };
export { LibrarySelectionActionsMenu };
