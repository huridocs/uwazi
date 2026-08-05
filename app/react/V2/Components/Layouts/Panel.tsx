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
    className={`${className || ''} flex flex-col h-full relative bg-paper text-ink`}
    data-testid="panel"
  >
    {children}
  </div>
);

Panel.Body = ({ children, className }: PanelProps) => (
  <div className={`${className || ''} grow overflow-y-auto min-h-0`} data-testid="panel-body">
    {children}
  </div>
);

Panel.Footer = ({ children, className = '', highlighted = false }: PanelFooterProps) => (
  <div
    className={`absolute bottom-0 left-0 right-0 w-full px-4 z-10 flex items-center
      border-t min-h-[50px] border-border-soft
      ${highlighted ? 'bg-selected' : 'bg-paper'} ${className}`}
    data-testid="panel-footer"
  >
    {children}
  </div>
);

export { Panel };
