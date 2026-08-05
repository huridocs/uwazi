import type React from 'react';
import type { TabButtonDef, TabPanelDef } from './tabsAtoms.js';

type TabConfig = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

const splitTabConfig = (tabs: TabConfig[]) => ({
  buttons: tabs.map(({ id, label }) => ({ id, label })) satisfies TabButtonDef[],
  panels: tabs.map(({ id, content }) => ({ id, children: content })) satisfies TabPanelDef[],
});

export type { TabConfig };
export { splitTabConfig };
