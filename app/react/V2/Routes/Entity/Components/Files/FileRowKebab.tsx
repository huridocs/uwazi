import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  LanguageIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { useEntityWriteAuthorized } from '#V2/Routes/Entity/Components/context/index.js';
import { EntityFileRow } from './types.js';

type FileRowKebabProps = {
  row: EntityFileRow;
  onView: (row: EntityFileRow) => void;
  onRename: (row: EntityFileRow) => void;
  onChangeLanguage: (row: EntityFileRow) => void;
  onDelete: (row: EntityFileRow) => void;
  showLanguageAction: boolean;
  disableMutations?: boolean;
};

type MenuAction = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
};

const MENU_WIDTH = 220;
const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const getThemedPortalRoot = (from: HTMLElement | null) => {
  if (typeof document === 'undefined') return null;
  return (
    from?.closest<HTMLElement>('.tw-content') ||
    document.querySelector<HTMLElement>('.tw-content') ||
    document.body
  );
};

const FileRowKebab = ({
  row,
  onView,
  onRename,
  onChangeLanguage,
  onDelete,
  showLanguageAction,
  disableMutations = false,
}: FileRowKebabProps) => {
  const canWrite = useEntityWriteAuthorized();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const actions: MenuAction[] = [
    {
      id: 'view',
      label: 'View',
      icon: EyeIcon,
      onClick: () => onView(row),
    },
  ];

  if (canWrite && !disableMutations) {
    actions.push({
      id: 'rename',
      label: 'Rename',
      icon: PencilIcon,
      onClick: () => onRename(row),
    });
    if (showLanguageAction) {
      actions.push({
        id: 'language',
        label: 'Change Language',
        icon: LanguageIcon,
        onClick: () => onChangeLanguage(row),
      });
    }
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      onClick: () => onDelete(row),
      danger: true,
      separatorBefore: true,
    });
  }

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const measure = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const rect = button.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const margin = 8;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - menuHeight - 4);
      }
      let left = rect.right - MENU_WIDTH;
      if (left < margin) left = margin;
      if (left + MENU_WIDTH > window.innerWidth - margin) {
        left = window.innerWidth - MENU_WIDTH - margin;
      }
      setPos({ top, left });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      const { target } = event;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const portalRoot = open ? getThemedPortalRoot(buttonRef.current) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={event => {
          event.stopPropagation();
          setOpen(current => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        className="flex items-center justify-center rounded p-1 transition-colors hover:bg-parchment"
      >
        <EllipsisVerticalIcon className="h-3.5 w-3.5 text-ink-tertiary" />
      </button>
      {open && portalRoot
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 min-w-56 rounded-md border border-border bg-paper py-1 shadow-lg"
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                visibility: pos ? 'visible' : 'hidden',
                width: MENU_WIDTH,
              }}
            >
              {actions.map(action => (
                <React.Fragment key={action.id}>
                  {action.separatorBefore ? (
                    <div className="mx-2 my-1 border-t border-border-soft" role="separator" />
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={event => {
                      event.stopPropagation();
                      setOpen(false);
                      action.onClick();
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-1.5 text-left text-xs leading-tight ${
                      action.danger
                        ? 'text-seal hover:bg-seal-tint'
                        : 'text-ink-secondary hover:bg-warm'
                    }`}
                  >
                    <action.icon className="h-3 w-3 shrink-0" />
                    <Translate>{action.label}</Translate>
                  </button>
                </React.Fragment>
              ))}
            </div>,
            portalRoot
          )
        : null}
    </>
  );
};

export { FileRowKebab, getThemedPortalRoot };
