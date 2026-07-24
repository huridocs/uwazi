import React, { type ReactNode } from 'react';
import { Popover } from '@headlessui/react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

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
  <div className="flex items-center justify-between gap-3 px-1.5 py-1">
    <span className="shrink-0 text-micro font-medium text-ink-secondary">{label}</span>
    {children}
  </div>
);

const DisplayMenu = ({ ariaLabel, children, modified = false, size = 'md' }: DisplayMenuProps) => {
  const box = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <Popover className="relative shrink-0">
      {({ open }) => (
        <>
          <Popover.Button
            aria-label={ariaLabel}
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
          </Popover.Button>
          <Popover.Panel
            role="menu"
            className="absolute end-0 z-40 mt-1 w-[17rem] rounded-md border border-border bg-paper p-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
          >
            {children}
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export type { DisplayMenuProps, DisplayMenuRowProps, DisplayMenuSize };
export { DisplayMenu, DisplayMenuRow };
