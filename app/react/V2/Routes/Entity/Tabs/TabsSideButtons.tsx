import React from 'react';
import { TabButtons } from '#V2/Components/UI/index.js';
import type { TabButtonDef } from '#V2/Components/UI/index.js';

type TabsSideButtonsProps = {
  buttons: TabButtonDef[];
  activeTabId?: string;
  onTabChange: (tabId: string) => void;
};

const TabsSideButtons = ({ buttons, activeTabId, onTabChange }: TabsSideButtonsProps) => (
  <TabButtons
    groupId="entity-side"
    buttons={buttons}
    activeTabId={activeTabId}
    onTabChange={onTabChange}
    tabListAriaLabel="Side panel tabs"
  />
);

export { TabsSideButtons };
