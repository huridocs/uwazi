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
  onTabSelected: (activeTab: string) => void;
}

const Tabs = ({ children, onTabSelected }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(children[0].props.id);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    newActiveTab: string
  ) => {
    e.preventDefault();
    setActiveTab(newActiveTab);
    onTabSelected(newActiveTab);
  };

  const buttonClass = 'flex-1 text-gray-700 font-medium py-2 w-80 h-14';

  return (
    <>
      <div
        className="flex border rounded-md shadow-sm md:w-1/2 border-gray-50"
        data-testid="tabs-comp"
      >
        {children.map((child, index: number) => (
          <button
            key={child.props.id}
            type="button"
            className={`${buttonClass} ${activeTab === child.props.id ? 'bg-gray-50' : ''} ${
              index !== children.length - 1 ? 'border-r-2 border-gray-50' : ''
            }`}
            onClick={e => handleClick(e, child.props.id)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {children.map(child => {
          if (child.props.id === activeTab) {
            return <div key={child.props.id}>{child.props.children}</div>;
          }
          return null;
        })}
      </div>
    </>
  );
};

Tabs.Tab = Tab;

export type { TabsProps };

export { Tabs };
