/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo, useState } from 'react';
import { Tab as HeadlessTab } from '@headlessui/react';

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
  tabListAriaLabel?: string;
}

const Tabs = ({
  children,
  onTabSelected,
  initialTabId,
  className,
  tabListClassName,
  tabListAriaLabel,
  unmountTabs = true,
}: TabsProps) => {
  const tabChildren = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);
  const totalTabs = tabChildren.length;
  const initialIndex = tabChildren.findIndex(child => child.props.id === initialTabId);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  useEffect(() => {
    const newIndex = tabChildren.findIndex(child => child.props.id === initialTabId);
    if (newIndex !== -1) {
      setSelectedIndex(newIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTabId, tabChildren]);

  const activeClass = 'text-gray-900 bg-gray-50';
  const inactiveClass = 'text-gray-500';

  const handleChange = (index: number) => {
    setSelectedIndex(index);

    if (onTabSelected) {
      onTabSelected(tabChildren[index].props.id);
    }
  };

  return (
    <HeadlessTab.Group selectedIndex={selectedIndex} onChange={handleChange} manual>
      <div className={`flex flex-col h-full gap-2 ${className ?? ''}`}>
        <HeadlessTab.List
          className={`inline-grid grid-flow-col auto-cols-auto rounded-md shadow-md shadow-black/10 border border-gray-100 w-fit ${
            tabListClassName || ''
          }`}
          aria-label={tabListAriaLabel}
          data-testid="tabs-comp"
        >
          {tabChildren.map((child, index) => {
            const isFirst = index === 0;
            const isLast = index === totalTabs - 1;
            const shapeClass = (() => {
              if (totalTabs === 1) {
                return 'rounded-md';
              }
              if (isFirst) {
                return 'rounded-l-md';
              }
              if (isLast) {
                return 'rounded-r-md';
              }
              return 'rounded-none';
            })();
            const dividerClass = isFirst ? '' : 'border-l border-gray-100';

            return (
              <HeadlessTab
                key={child.props.id}
                id={`tab-${child.props.id}`}
                as="button"
                type="button"
                className={({ selected }) =>
                  [
                    'p-2 text-left flex items-center justify-start h-full',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-primary-400 focus-visible:ring-inset',

                    shapeClass,
                    dividerClass,
                    selected ? activeClass : inactiveClass,
                  ].join(' ')
                }
              >
                {child.props.label}
              </HeadlessTab>
            );
          })}
        </HeadlessTab.List>
        <HeadlessTab.Panels className="grow overflow-y-auto">
          {tabChildren.map(child => (
            <HeadlessTab.Panel
              key={child.props.id}
              id={`panel-${child.props.id}`}
              className="w-full h-full focus:outline-hidden"
              unmount={unmountTabs}
            >
              {child.props.children}
            </HeadlessTab.Panel>
          ))}
        </HeadlessTab.Panels>
      </div>
    </HeadlessTab.Group>
  );
};

Tabs.Tab = Tab;

export type { TabsProps };

export { Tabs };
