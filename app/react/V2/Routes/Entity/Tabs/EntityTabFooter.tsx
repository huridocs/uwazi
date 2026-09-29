import React, { PropsWithChildren } from 'react';

type EntityTabFooterProps = PropsWithChildren<{
  highlighted?: boolean;
  className?: string;
  inset?: 'side' | 'main';
}>;

const EntityTabFooter = ({
  children,
  highlighted = false,
  className = '',
  inset = 'main',
}: EntityTabFooterProps) => (
  <div
    className={`shrink-0 flex min-h-12 h-auto w-full flex-wrap items-center gap-2 border-t border-border ${
      inset === 'side' ? 'px-3' : 'px-4'
    } ${highlighted ? 'bg-selected' : 'bg-paper'} ${className}`}
    data-testid="entity-tab-footer"
  >
    {children}
  </div>
);

export { EntityTabFooter };
