import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { BaseDropdown } from './BaseDropdown.js';
import type { MobileMenuAction } from './MobileMenuDropdown.js';

interface MobileOptionsMenuProps {
  actions?: MobileMenuAction[];
  children?: React.ReactNode;
}

const MobileOptionsMenu = ({ actions = [], children }: MobileOptionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const trigger = (
    <button
      type="button"
      className="header-bar-icon-button flex h-9 w-9 items-center justify-center rounded-md transition-colors"
      aria-expanded={isOpen}
      aria-label="Toggle options menu"
    >
      <Bars3Icon className="h-5 w-5" />
    </button>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      isOpen={isOpen}
      onToggle={setIsOpen}
      align="right"
      dropdownClassName="w-64 max-w-[calc(100vw-2rem)]"
    >
      {isOpen ? (
        <div className="flex flex-col gap-1 p-2">
          {actions.map(action => (
            <I18NLink
              key={action.id}
              to={action.to}
              className="header-bar-panel-item block rounded-md px-3 py-2 text-sm transition-colors"
              onClick={() => {
                action.onClick?.();
                close();
              }}
            >
              <Translate>{action.label}</Translate>
            </I18NLink>
          ))}
          {children}
        </div>
      ) : null}
    </BaseDropdown>
  );
};

export { MobileOptionsMenu };
