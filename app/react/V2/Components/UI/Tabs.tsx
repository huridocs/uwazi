/* eslint-disable react/no-multi-comp */
import React, { useId, useMemo } from 'react';
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
  domIdPrefix?: string;
}

const Tabs = ({
  children,
  onTabSelected,
  initialTabId,
  className,
  tabListClassName,
  tabListAriaLabel,
  unmountTabs = true,
  domIdPrefix,
}: TabsProps) => {
  const generatedPrefix = useId().replace(/:/g, '');
  const domPrefix = domIdPrefix ?? generatedPrefix;
  const tabChildren = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);
  const totalTabs = tabChildren.length;
  const selectedIndex = useMemo(() => {
    if (tabChildren.length === 0) return 0;
    const idx = tabChildren.findIndex(child => child.props.id === initialTabId);
    return idx !== -1 ? idx : 0;
  }, [initialTabId, tabChildren]);

  const activeClass = 'text-ink bg-vellum';
  const inactiveClass = 'text-ink-tertiary bg-paper hover:text-ink-secondary';
  const tabListChromeClass = 'tabs-segmented-list';

  const tabScrollWrapClass = [
    'tabs-segmented-scroll mx-[var(--spacing-theme-3)] my-[var(--spacing-theme-2)] md:my-[var(--spacing-theme-2-5)]',
  ].join(' ');

  const handleChange = (index: number) => {
    onTabSelected?.(tabChildren[index].props.id);
  };

  const groupProps = onTabSelected
    ? { selectedIndex, onChange: handleChange }
    : { defaultIndex: selectedIndex, onChange: handleChange };

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <HeadlessTab.Group {...groupProps}>
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
                  id={`${domPrefix}-tab-${child.props.id}`}
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
        <HeadlessTab.Panels className="grow overflow-y-auto">
          {tabChildren.map(child => (
            <HeadlessTab.Panel
              key={child.props.id}
              id={`${domPrefix}-panel-${child.props.id}`}
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
