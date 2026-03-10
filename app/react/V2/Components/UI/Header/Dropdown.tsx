import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { BaseDropdown } from './BaseDropdown';

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
    <div className="flex items-center py-2 border-b-2 border-transparent hover:border-primary-600">
      <button
        type="button"
        className="flex items-center p-2 gap-1 text-base font-medium text-gray-700 hover:text-primary-600 transition-colors rounded-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {title}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
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
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${roundedClasses}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
              >
                {item.title}
              </a>
            ) : (
              <a
                href={item.url}
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${roundedClasses}`}
                onClick={() => setIsOpen(false)}
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
              >
                {item.title}
              </a>
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
