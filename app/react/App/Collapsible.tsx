import { Icon } from 'UI';
import React, { ReactElement, useEffect, useState } from 'react';

interface CollapsibleProps {
  className?: string;
  header: string | ReactElement;
  headerInfo?: string;
  children: ReactElement<any, any>;
  collapse?: boolean;
}

const Collapsible = ({ header, children, className, headerInfo, collapse }: CollapsibleProps) => {
  const [collapsed, setCollapsed] = useState(collapse);
  useEffect(() => {
    setCollapsed(collapse);
  }, [collapse]);
  return (
    <div className={className}>
      <div className="header" onClick={() => setCollapsed(!collapsed)}>
        <span className="header-icon">
          <Icon icon={collapsed ? 'caret-right' : 'caret-down'} />
        </span>
        <span>{header}</span>
        {headerInfo && <span className="header-info">{headerInfo}</span>}
      </div>
      {!collapsed && <div className="content">{children}</div>}
    </div>
  );
};

export { Collapsible };
