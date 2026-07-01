import React, { type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Drawer } from './Drawer.js';
import { IconButton } from './IconButton.js';

type FiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

const FiltersDrawer = ({ open, onClose, footer, children }: FiltersDrawerProps) => (
  <Drawer
    open={open}
    onClose={onClose}
    scope="absolute"
    ariaLabel="Filters"
    header={
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft bg-paper px-4 py-2.5">
        <span className="text-xs font-semibold text-ink-secondary">
          <Translate>Filters</Translate>
        </span>
        <IconButton variant="drawer" onClick={onClose} aria-label="Close filters">
          <XMarkIcon className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    }
    footer={
      footer ? (
        <div className="shrink-0 border-t border-border-soft bg-paper px-4 py-2">{footer}</div>
      ) : undefined
    }
  >
    {children}
  </Drawer>
);

export { FiltersDrawer };
