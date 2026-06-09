import React, { useMemo } from 'react';
import { TabButtons } from './TabButtons.js';
import { TabPanels } from './TabPanels.js';
import { Tab } from './Tab.js';
import { parseTabChildren } from './parseTabChildren.js';
import { splitTabConfig } from './tabConfig.js';

type TabsProps = {
  groupId: string;
  children: React.ReactNode;
  onTabSelected?: (activeTab: string) => void;
  onTabChange?: (activeTab: string) => void;
  activeTabId?: string;
  unmountTabs?: boolean;
  className?: string;
  tabListClassName?: string;
  tabListAriaLabel?: string;
};

const Tabs = ({
  groupId,
  children,
  className,
  tabListClassName,
  tabListAriaLabel,
  onTabSelected,
  onTabChange,
  activeTabId,
  unmountTabs = true,
}: TabsProps) => {
  const tabConfigs = useMemo(() => parseTabChildren(children), [children]);
  const { buttons, panels } = useMemo(() => splitTabConfig(tabConfigs), [tabConfigs]);
  const handleTabChange = onTabChange ?? onTabSelected;

  return (
    <div className={`flex min-h-0 min-w-0 w-full flex-col h-full ${className ?? ''}`}>
      <TabButtons
        groupId={groupId}
        buttons={buttons}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        tabListClassName={tabListClassName}
        tabListAriaLabel={tabListAriaLabel}
      />
      <TabPanels
        groupId={groupId}
        panels={panels}
        unmountInactive={unmountTabs}
        className="grow overflow-y-auto"
      />
    </div>
  );
};

Tabs.Tab = Tab;

export type { TabsProps };
export { Tabs };
