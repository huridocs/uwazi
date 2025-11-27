/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren } from 'react';

interface PanelProps extends PropsWithChildren {
  className?: string;
}

interface PanelFooterProps extends PanelProps {
  highlighted?: boolean;
}

const Panel = ({ children, className }: PanelProps) => (
  <div className={`${className || ''} flex flex-col h-full relative`} data-testid="panel">
    {children}
  </div>
);
const footerHeight = 50;
const paddingBottom = footerHeight + 8;
Panel.Body = ({ children, className }: PanelProps) => (
  <div
    className={`${className || ''} grow overflow-y-auto min-h-0 px-4 pb-[${paddingBottom}px]`}
    data-testid="panel-body"
  >
    {children}
  </div>
);

Panel.Footer = ({ children, className = '', highlighted = false }: PanelFooterProps) => (
  <div
    className={`absolute bottom-0 left-0 right-0 w-full px-4 border-t border-gray-200 z-10 h-[${footerHeight}px] flex items-center ${className} ${
      highlighted ? 'bg-indigo-50' : 'bg-white'
    }`}
    data-testid="panel-footer"
  >
    {children}
  </div>
);

export { Panel };
