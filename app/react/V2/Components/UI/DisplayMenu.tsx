/* eslint-disable react/no-multi-comp */
import React, { useRef, useState, type ReactNode } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { AccentDot } from './AccentDot.js';
import { AnchoredPortal } from './AnchoredPortal.js';

type DisplayMenuSize = 'sm' | 'md';

type DisplayMenuProps = {
  ariaLabel: string;
  children: ReactNode;
  modified?: boolean;
  size?: DisplayMenuSize;
  appearance?: 'plain' | 'outlined';
};

type DisplayMenuRowProps = {
  label: ReactNode;
  children: ReactNode;
};

type DisplayMenuCheckRowProps = {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onToggle: () => void;
};

const DisplayMenuRow = ({ label, children }: DisplayMenuRowProps) => (
  <div className="relative flex items-center justify-between gap-3 overflow-visible px-1.5 py-1">
    <span className="shrink-0 text-micro font-medium text-ink-secondary">{label}</span>
    {children}
  </div>
);

const DisplayMenuCheckRow = ({
  label,
  description,
  checked,
  onToggle,
}: DisplayMenuCheckRowProps) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={checked}
    onClick={onToggle}
    className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-start transition-colors hover:bg-warm"
  >
    <span className="flex w-4 shrink-0 items-center justify-center text-carbon">
      {checked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block text-xs ${checked ? 'text-ink' : 'text-ink-tertiary'}`}>{label}</span>
      {description ? <span className="block text-nano text-ink-muted">{description}</span> : null}
    </span>
  </button>
);

const displayMenuButtonClass = ({
  size,
  appearance,
  open,
  modified,
}: {
  size: DisplayMenuSize;
  appearance: 'plain' | 'outlined';
  open: boolean;
  modified: boolean;
}) => {
  const box = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const outlined = appearance === 'outlined';
  const active = open || modified;
  let tone = 'bg-warm text-ink-secondary hover:bg-parchment hover:text-ink';
  if (outlined && active) {
    tone = 'border border-ink/40 bg-paper text-ink shadow-sm';
  } else if (outlined) {
    tone = 'border border-border bg-paper text-ink-secondary hover:bg-parchment hover:text-ink';
  } else if (active) {
    tone = 'bg-vellum text-ink';
  }
  return [
    'relative inline-flex cursor-pointer items-center justify-center rounded-md',
    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30',
    box,
    tone,
  ].join(' ');
};

const DisplayMenu = ({
  ariaLabel,
  children,
  modified = false,
  size = 'md',
  appearance = 'plain',
}: DisplayMenuProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const buttonClass = displayMenuButtonClass({ size, appearance, open, modified });

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={buttonClass}
      >
        <AdjustmentsHorizontalIcon className={icon} aria-hidden />
        {modified && <AccentDot className="absolute -top-0.5 -inset-e-0.5" />}
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

export type { DisplayMenuCheckRowProps, DisplayMenuProps, DisplayMenuRowProps, DisplayMenuSize };
export { DisplayMenu, DisplayMenuCheckRow, DisplayMenuRow };
