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
  }, [initialTabId, tabChildren]);

  const activeClass = 'text-ink bg-vellum';
  const inactiveClass = 'text-ink-tertiary bg-paper hover:text-ink-secondary';
  const tabListChromeClass = 'tabs-segmented-list';

  const tabScrollWrapClass = [
    'tabs-segmented-scroll mx-[var(--spacing-theme-3)] my-[var(--spacing-theme-2)] md:my-[var(--spacing-theme-2-5)]',
  ].join(' ');

  const handleChange = (index: number) => {
    setSelectedIndex(index);

    if (onTabSelected) {
      onTabSelected(tabChildren[index].props.id);
    }
  };

  return (
    <HeadlessTab.Group selectedIndex={selectedIndex} onChange={handleChange} manual>
      <div className={`flex min-h-0 min-w-0 w-full flex-col h-full ${className ?? ''}`}>
        <div className={`${tabScrollWrapClass} ${tabListClassName || ''}`} data-testid="tabs-comp">
          <HeadlessTab.List className={tabListChromeClass} aria-label={tabListAriaLabel}>
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
              const dividerClass = isFirst ? '' : 'border-segmented-divide shrink-0';

              return (
                <HeadlessTab
                  key={child.props.id}
                  id={`tab-${child.props.id}`}
                  as="button"
                  type="button"
                  className={({ selected }) =>
                    [
                      'tabs-segmented-trigger transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-(--color-theme-control-border-focus) focus-visible:ring-inset',

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
        </div>
        <HeadlessTab.Panels className="grow overflow-y-auto min-h-0 min-w-0">
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
