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
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`absolute inset-0 z-30 transition-opacity ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(38, 30, 20, 0.18)' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`absolute bottom-0 right-0 top-0 z-40 flex flex-col bg-paper shadow-lg transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: 'min(100%, 340px)',
          borderLeft: '1px solid var(--color-theme-border-default)',
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border-soft px-4 py-2.5">
          <span className="text-xs font-semibold text-ink-secondary">
            <Translate>Filters</Translate>
          </span>
          <IconButton variant="drawer" onClick={onClose} aria-label="Close filters">
            <XMarkIcon className="h-3.5 w-3.5" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-border-soft px-4 py-2">{footer}</footer>
        )}
      </aside>
    </>
  );
};

export { FiltersDrawer };
