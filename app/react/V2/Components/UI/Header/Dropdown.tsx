import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { BaseDropdown } from './BaseDropdown.js';

export interface DropdownItem {
  title: string;
  url: string;
  isExternal?: boolean;
}

export interface DropdownProps {
  title: string;
  items: DropdownItem[];
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ title, items, className = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const trigger = (
    <button
      type="button"
      className={`header-bar-button ${
        isOpen ? 'header-bar-button-active' : ''
      } flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors`}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      {title}
      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );

  const getRoundedClasses = (isFirst: boolean, isLast: boolean): string => {
    if (isFirst && isLast) return 'rounded-md';
    if (isFirst) return 'rounded-t-md';
    if (isLast) return 'rounded-b-md';
    return '';
  };

  const dropdownContent = (
    <>
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const roundedClasses = getRoundedClasses(isFirst, isLast);

        return (
          <li key={`${item.url}-${item.title}`} role="none">
            {item.isExternal ? (
              <a
                href={item.url}
                className={`header-bar-panel-item block px-3 py-2 text-xs font-medium transition-colors ${roundedClasses}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
              >
                {item.title}
              </a>
            ) : (
              <I18NLink
                to={item.url}
                className={`header-bar-panel-item block px-3 py-2 text-xs font-medium transition-colors ${roundedClasses}`}
                onClick={() => setIsOpen(false)}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
              >
                {item.title}
              </I18NLink>
            )}
          </li>
        );
      })}
    </>
  );

  return (
    <BaseDropdown trigger={trigger} className={className} isOpen={isOpen} onToggle={setIsOpen}>
      {dropdownContent}
    </BaseDropdown>
  );
};
