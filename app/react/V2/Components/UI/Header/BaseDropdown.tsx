import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';

export interface BaseDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  dropdownClassName?: string;
  onToggle?: (isOpen: boolean) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;
}

export const BaseDropdown: React.FC<BaseDropdownProps> = ({
  trigger,
  children,
  className = '',
  dropdownClassName = '',
  onToggle,
  isOpen: controlledIsOpen,
  defaultOpen = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClickOutside = useCallback(() => {
    const newIsOpen = false;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newIsOpen);
    }
    onToggle?.(newIsOpen);
  }, [controlledIsOpen, onToggle]);

  useOnClickOutsideElement<HTMLDivElement>(dropdownRef, handleClickOutside);

  const toggleDropdown = useCallback(() => {
    const newIsOpen = !isOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newIsOpen);
    }
    onToggle?.(newIsOpen);
  }, [isOpen, controlledIsOpen, onToggle]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {React.cloneElement(trigger as React.ReactElement, {
        onClick: toggleDropdown,
      })}

      <ul
        className={`${dropdownClassName} ${
          isOpen
            ? 'absolute top-full left-0 mt-1 min-w-max bg-white border border-gray-200 rounded-md shadow-lg z-50'
            : 'absolute left-[-9999px] top-0 w-0 h-0 overflow-hidden'
        }`}
        aria-hidden={!isOpen}
        role="menu"
      >
        {children}
      </ul>
    </div>
  );
};
