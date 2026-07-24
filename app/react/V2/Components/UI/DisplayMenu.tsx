import React, { useRef, useState, type ReactNode } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { AnchoredPortal } from './AnchoredPortal.js';

type DisplayMenuSize = 'sm' | 'md';

type DisplayMenuProps = {
  ariaLabel: string;
  children: ReactNode;
  modified?: boolean;
  size?: DisplayMenuSize;
};

type DisplayMenuRowProps = {
  label: ReactNode;
  children: ReactNode;
};

const DisplayMenuRow = ({ label, children }: DisplayMenuRowProps) => (
  <div className="relative flex items-center justify-between gap-3 overflow-visible px-1.5 py-1">
    <span className="shrink-0 text-micro font-medium text-ink-secondary">{label}</span>
    {children}
  </div>
);

const DisplayMenu = ({ ariaLabel, children, modified = false, size = 'md' }: DisplayMenuProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const box = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`relative inline-flex cursor-pointer items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30 ${box} ${
          open || modified
            ? 'bg-vellum text-ink'
            : 'bg-warm text-ink-secondary hover:bg-parchment hover:text-ink'
        }`}
      >
        <AdjustmentsHorizontalIcon className={icon} aria-hidden />
        {modified && (
          <span
            className="absolute -top-0.5 -end-0.5 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-blue)' }}
            aria-hidden
          />
        )}
      </button>
      <AnchoredPortal
        open={open}
        anchorRef={buttonRef}
        prefer="end"
        width={272}
        onClose={() => setOpen(false)}
        className="overflow-visible rounded-md border border-border bg-paper p-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
      >
        <div role="menu" className="overflow-visible">
          {children}
        </div>
      </AnchoredPortal>
    </div>
  );
};

export type { DisplayMenuProps, DisplayMenuRowProps, DisplayMenuSize };
export { DisplayMenu, DisplayMenuRow };
