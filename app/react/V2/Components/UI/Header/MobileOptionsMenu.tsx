import React, { useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { BaseDropdown } from './BaseDropdown.js';
import { HeaderIcon, headerIconButtonClass, joinActive } from './headerIcons.js';
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
      className={joinActive(headerIconButtonClass, isOpen)}
      aria-expanded={isOpen}
      aria-label={t('System', 'Toggle options menu', null, false)}
    >
      <HeaderIcon name="ellipsis-vertical" />
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
              className="header-bar-panel-item block rounded-md px-3 py-2 text-xs font-medium transition-colors"
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
