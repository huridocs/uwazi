import React, { PropsWithChildren } from 'react';

type EntityTabFooterProps = PropsWithChildren<{
  highlighted?: boolean;
  className?: string;
  inset?: 'side' | 'main';
  padding?: 'px-3' | 'px-4';
  ref?: React.Ref<HTMLDivElement>;
}>;

const EntityTabFooter = ({
  children,
  highlighted = false,
  className = '',
  inset = 'main',
  padding,
  ref,
}: EntityTabFooterProps) => (
  <div
    ref={ref}
    className={`shrink-0 flex min-h-12 h-auto w-full flex-wrap items-center gap-2 border-t border-border ${
      padding ?? (inset === 'side' ? 'px-3' : 'px-4')
    } ${highlighted ? 'bg-selected' : 'bg-paper'} ${className}`}
    data-testid="entity-tab-footer"
  >
    {children}
  </div>
);

export { EntityTabFooter };
