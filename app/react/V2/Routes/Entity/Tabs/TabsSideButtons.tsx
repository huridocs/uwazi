import React from 'react';
import { TabButtons } from '#V2/Components/UI/index.js';
import type { TabButtonDef } from '#V2/Components/UI/index.js';

type TabsSideButtonsProps = {
  buttons: TabButtonDef[];
  onTabChange: (tabId: string) => void;
};

const TabsSideButtons = ({ buttons, onTabChange }: TabsSideButtonsProps) => (
  <TabButtons
    groupId="entity-side"
    buttons={buttons}
    onTabChange={onTabChange}
    tabListAriaLabel="Side panel tabs"
  />
);

export { TabsSideButtons };
