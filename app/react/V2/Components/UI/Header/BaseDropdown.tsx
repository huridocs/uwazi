import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { useOnClickOutsideElement } from '#app/utils/useOnClickOutsideElementHook.js';

export interface BaseDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  dropdownClassName?: string;
  onToggle?: (isOpen: boolean) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;
  align?: 'left' | 'right';
}

export const BaseDropdown: React.FC<BaseDropdownProps> = ({
  trigger,
  children,
  className = '',
  dropdownClassName = '',
  onToggle,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  align = 'left',
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
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger, {
            onClick: (event: React.MouseEvent) => {
              trigger.props.onClick?.(event);
              if (!event.defaultPrevented) toggleDropdown();
            },
          })
        : trigger}

      <ul
        className={`${dropdownClassName} ${
          isOpen
            ? `header-bar-panel absolute top-full mt-1.5 min-w-max z-50 ${
                align === 'right' ? 'right-0' : 'left-0'
              }`
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
