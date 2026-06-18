import React, { useEffect, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { IconButton } from './IconButton.js';

type FiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

const FiltersDrawer = ({ open, onClose, footer, children }: FiltersDrawerProps) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`absolute inset-0 z-30 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: 'rgba(38, 30, 20, 0.18)' }}
      />
      <aside
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="Filters"
        className="absolute top-0 bottom-0 z-40 flex flex-col bg-paper shadow-lg transition-[transform,visibility] duration-200 ease-out"
        style={{
          right: 0,
          left: 'auto',
          width: 'min(100%, 340px)',
          borderLeft: '1px solid var(--color-theme-border-default)',
          visibility: open ? 'visible' : 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-paper px-4 py-2.5">
          <span className="text-xs font-semibold text-ink-secondary">
            <Translate>Filters</Translate>
          </span>
          <IconButton variant="drawer" onClick={onClose} aria-label="Close filters">
            <XMarkIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-border-soft bg-paper px-4 py-2">{footer}</div>
        )}
      </aside>
    </div>
  );
};

export { FiltersDrawer };
