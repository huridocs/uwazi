/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';

const Tab = ({
  id,
  label,
  children,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="hidden" id={id} data-label={label}>
    {children}
  </div>
);

interface TabsProps {
  children: React.ReactComponentElement<typeof Tab>[];
  onTabSelected?: (activeTab: string) => void;
  unmountTabs?: boolean;
}

const Tabs = ({ children, onTabSelected, unmountTabs = true }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(children[0].props.id);

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

  const buttonClass = 'text-sm flex-1 font-medium py-2 w-80 h-14';
  const activeClass = 'text-gray-900 bg-gray-50';
  const inactiveClass = 'text-gray-500';

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex rounded-md border border-gray-50 shadow-sm md:w-1/2"
        data-testid="tabs-comp"
      >
        {children.map((child, index: number) => (
          <button
            key={child.props.id}
            type="button"
            className={`${buttonClass} ${
              activeTab === child.props.id ? activeClass : inactiveClass
            } ${index !== children.length - 1 ? 'border-r-2 border-gray-50' : ''}`}
            onClick={e => handleClick(e, child.props.id)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="py-4 grow">
        {children.map(child => {
          if (unmountTabs) {
            if (child.props.id === activeTab) {
              return (
                <div className="w-full h-full" key={child.props.id}>
                  {child.props.children}
                </div>
              );
            }
          }

          if (!unmountTabs) {
            return (
              <div
                key={child.props.id}
                className={`w-full h-full ${child.props.id !== activeTab ? 'hidden' : ''}`}
              >
                {child.props.children}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

Tabs.Tab = Tab;

export type { TabsProps };

export { Tabs };
