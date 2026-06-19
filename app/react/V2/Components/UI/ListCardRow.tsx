/* eslint-disable react/require-default-props */
import React, { KeyboardEvent, ReactNode, forwardRef } from 'react';

type ListCardRowProps = {
  selected: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

const baseClasses =
  'group px-3 py-2.5 border-b border-border/50 last:border-b-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20';

const ListCardRow = forwardRef<HTMLDivElement, ListCardRowProps>(
  ({ selected, onClick, className = '', children }, ref) => {
    const composed = `${baseClasses} ${selected ? 'bg-parchment' : ''} ${className}`;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onClick}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={composed}
      >
        {children}
      </div>
    );
  }
);

ListCardRow.displayName = 'ListCardRow';

export { ListCardRow };
