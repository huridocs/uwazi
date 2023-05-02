import React, { useState } from 'react';

const Tabs = ({ children }: { children: any[] | any }) => {
  const [activeTab, setActiveTab] = useState(children[0].props.label);

  const handleClick = (e: any, newActiveTab: any) => {
    e.preventDefault();
    setActiveTab(newActiveTab);
  };

  return (
    <>
      <div className="flex w-1/2">
        {children.map((child: any, index: number) => (
          <button
            key={child.props.label}
            type="button"
            className={`${
              activeTab === child.props.label ? ' bg-gray-50' : ''
            } flex-1 text-gray-700 font-medium py-2 w-80 h-14 border-b-2 ${
              index !== children.length - 1 ? 'border-r-2 border-primary-50' : ''
            }`}
            onClick={e => handleClick(e, child.props.label)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {children.map((child: any) => {
          if (child.props.label === activeTab) {
            return <div key={child.props.label}>{child.props.children}</div>;
          }
          return null;
        })}
      </div>
    </>
  );
};

const Tab = ({ label, children }: { label: string; children: any[] | any }) => {
  return <div className="hidden">{children}</div>;
};
export { Tabs, Tab };
