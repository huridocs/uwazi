import React, { useEffect, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';

const actionsButtonClassName =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm hover:text-ink aria-expanded:bg-warm aria-expanded:text-ink';

type LibrarySelectionActionsMenuProps = {
  actions: LibrarySelectionAction[];
  onAction?: (action: LibraryBulkAction) => void;
};

const menuItems = (menu: HTMLElement | null) => [
  ...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
];

const nextMenuItem = (menu: HTMLElement | null, key: string) => {
  const items = menuItems(menu);
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (key === 'Home') {
    return items[0];
  }
  if (key === 'End') {
    return items[items.length - 1];
  }
  if (key !== 'ArrowDown' && key !== 'ArrowUp') {
    return undefined;
  }
  const step = key === 'ArrowDown' ? 1 : -1;
  return items[(index + step + items.length) % items.length];
};

const onMenuKeyDown = (event: React.KeyboardEvent, menu: HTMLElement | null, close: () => void) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  const next = nextMenuItem(menu, event.key);
  if (!next) {
    return;
  }
  event.preventDefault();
  next.focus();
};

const LibrarySelectionActionsMenu = ({ actions, onAction }: LibrarySelectionActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const regular = actions.filter(action => !action.danger);
  const danger = actions.filter(action => action.danger);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const item = (action: LibrarySelectionAction) => (
    <button
      key={action.id}
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onAction?.(action.id);
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-start text-xs focus:outline-none focus-visible:bg-warm ${
        action.danger ? 'text-seal-label hover:bg-seal-tint/40' : 'text-ink hover:bg-warm'
      }`}
    >
      <span className={action.danger ? '' : 'text-ink-tertiary'} aria-hidden>
        {action.icon}
      </span>
      <span className="min-w-0 flex-1">
        <Translate>{action.label}</Translate>
      </span>
    </button>
  );

  return (
    <div data-component="SelectionActionsMenu" className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        data-gutter-align="box"
        className={actionsButtonClassName}
      >
        <Translate>Actions</Translate>
        <LibrarySelectionIcon name="chevron-down" size={12} />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Selection actions"
          tabIndex={-1}
          onKeyDown={event => onMenuKeyDown(event, menuRef.current, close)}
          onBlur={event => {
            const next = event.relatedTarget as Node | null;
            if (next && (menuRef.current?.contains(next) || buttonRef.current?.contains(next))) {
              return;
            }
            setOpen(false);
          }}
          className="absolute end-0 bottom-full z-20 mb-1.5 w-56 rounded-md border border-border bg-paper p-1 shadow-lg"
        >
          {regular.map(item)}
          {danger.length > 0 ? <hr className="my-1 h-px border-0 bg-border" /> : null}
          {danger.map(item)}
        </div>
      ) : null}
    </div>
  );
};

export type { LibrarySelectionActionsMenuProps };
export { LibrarySelectionActionsMenu };
