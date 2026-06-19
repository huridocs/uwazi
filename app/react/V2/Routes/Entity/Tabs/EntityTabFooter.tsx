import React, { PropsWithChildren } from 'react';

type EntityTabFooterProps = PropsWithChildren<{
  highlighted?: boolean;
  className?: string;
}>;

const EntityTabFooter = ({
  children,
  highlighted = false,
  className = '',
}: EntityTabFooterProps) => (
  <div
    className={`shrink-0 flex h-[3.125rem] max-h-[3.125rem] w-full items-center overflow-hidden border-t border-border-soft px-3 ${
      highlighted ? 'bg-selected' : 'bg-paper'
    } ${className}`}
    data-testid="entity-tab-footer"
  >
    {children}
  </div>
);

export { EntityTabFooter };
