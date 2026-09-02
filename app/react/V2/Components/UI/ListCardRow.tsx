/* eslint-disable react/require-default-props */
import React, { KeyboardEvent, ReactNode, forwardRef } from 'react';

type ListCardRowProps = {
  selected: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

const staticClasses =
  'group px-3 py-2.5 border-b border-border/50 last:border-b-0 transition-colors';
const interactiveClasses = `${staticClasses} cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20`;

const ListCardRow = forwardRef<HTMLDivElement, ListCardRowProps>(
  ({ selected, onClick, className = '', children }, ref) => {
    const selectedClass = selected ? 'bg-parchment [&_.text-ink-tertiary]:text-ink-secondary' : '';
    const composed = `${onClick ? interactiveClasses : staticClasses} ${selectedClass} ${className}`;

    return (
      <div
        ref={ref}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-pressed={onClick ? selected : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={composed}
      >
        {children}
      </div>
    );
  }
);

ListCardRow.displayName = 'ListCardRow';

export { ListCardRow };
