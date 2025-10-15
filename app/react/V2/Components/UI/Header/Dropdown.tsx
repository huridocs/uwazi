import React, { useRef, useState, useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
  }, []);

  useOnClickOutsideElement<HTMLDivElement>(dropdownRef, handleClickOutside);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-1 py-4 px-2 text-base font-medium text-gray-700 border-b-2 border-transparent hover:border-primary-600 hover:text-primary-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {title}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-max bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {items.map(item => (
              <div key={`${item.url}-${item.title}`}>
                {item.isExternal ? (
                  <a
                    href={item.url}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.title}
                  </a>
                ) : (
                  <a
                    href={item.url}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.title}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
