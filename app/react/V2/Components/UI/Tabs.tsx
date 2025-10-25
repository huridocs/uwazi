/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';

type TabProps = {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
};

const Tab = ({ id, label, children }: TabProps) => (
  <div className="hidden" id={id} data-label={label}>
    {children}
  </div>
);

interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];
  onTabSelected?: (activeTab: string) => void;
  initialTabId?: string;
  unmountTabs?: boolean;
  className?: string;
  tabListClassName?: string;
}

const Tabs = ({
  children,
  onTabSelected,
  initialTabId,
  className,
  tabListClassName,
  unmountTabs = true,
}: TabsProps) => {
  const tabChildren = Array.isArray(children) ? children : [children];
  const [activeTab, setActiveTab] = useState(initialTabId || tabChildren[0].props.id);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    newActiveTab: string
  ) => {
    e.preventDefault();
    setActiveTab(newActiveTab);

    if (onTabSelected) {
      onTabSelected(newActiveTab);
    }
  };

  const activeClass = 'text-gray-900 bg-gray-50';
  const inactiveClass = 'text-gray-500';

  return (
    <div className={`flex flex-col h-full ${className ?? ''}`}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={`inline-grid grid-flow-col auto-cols-auto rounded-md shadow divide-x-2 divide-gray-100 w-max ${tabListClassName || ''}`}
        data-testid="tabs-comp"
      >
        {tabChildren.map(child => (
          <button
            key={child.props.id}
            id={`tab-${child.props.id}`}
            role="tab"
            aria-controls={`panel-${child.props.id}`}
            aria-selected={activeTab === child.props.id}
            tabIndex={activeTab === child.props.id ? 0 : -1}
            type="button"
            className={`p-2 text-left flex items-center justify-start h-full ${
              activeTab === child.props.id ? activeClass : inactiveClass
            }`}
            onClick={e => handleClick(e, child.props.id)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="py-4 grow overflow-y-auto">
        {tabChildren.map(child => {
          const isActive = child.props.id === activeTab;

          if (unmountTabs) {
            if (isActive) {
              return (
                <div
                  className="w-full h-full"
                  key={child.props.id}
                  id={`panel-${child.props.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${child.props.id}`}
                >
                  {child.props.children}
                </div>
              );
            }

            return null;
          }

          return (
            <div
              key={child.props.id}
              id={`panel-${child.props.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${child.props.id}`}
              className={`w-full h-full ${!isActive ? 'hidden' : ''}`}
            >
              {child.props.children}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Tabs.Tab = Tab;

export type { TabsProps };

export { Tabs };
