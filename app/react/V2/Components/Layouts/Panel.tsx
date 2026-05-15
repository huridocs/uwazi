/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren } from 'react';

interface PanelProps extends PropsWithChildren {
  className?: string;
}

interface PanelFooterProps extends PanelProps {
  highlighted?: boolean;
}

const Panel = ({ children, className }: PanelProps) => (
  <div
    className={`${className || ''} flex flex-col h-full relative bg-(--color-theme-surface-raised) text-ink`}
    data-testid="panel"
  >
    {children}
  </div>
);

Panel.Body = ({ children, className }: PanelProps) => (
  <div
    className={`${className || ''} grow overflow-y-auto min-h-0 px-(--spacing-theme-4) pb-[calc(var(--spacing-theme-12)+10px)]`}
    data-testid="panel-body"
  >
    {children}
  </div>
);

Panel.Footer = ({ children, className = '', highlighted = false }: PanelFooterProps) => (
  <div
    className={`absolute bottom-0 left-0 right-0 w-full px-(--spacing-theme-4) z-10 flex items-center
      border-t min-h-[50px] border-[color-mix(in_srgb,var(--color-theme-border-default)_65%,transparent)]
      ${highlighted ? 'bg-(--color-theme-surface-selected)' : 'bg-(--color-theme-surface-raised)'} ${className}`}
    data-testid="panel-footer"
  >
    {children}
  </div>
);

export { Panel };
