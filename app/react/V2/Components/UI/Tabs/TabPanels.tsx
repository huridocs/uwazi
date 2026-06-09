import React, { useEffect } from 'react';
import { useTabGroup } from './useTabGroup.js';
import type { TabPanelDef } from './tabsAtoms.js';

type TabPanelsProps = {
  groupId: string;
  panels: TabPanelDef[];
  unmountInactive?: boolean;
  className?: string;
};

const TabPanels = ({ groupId, panels, unmountInactive = true, className }: TabPanelsProps) => {
  const { activeTabId, syncPanels } = useTabGroup(groupId);

  useEffect(() => {
    syncPanels(panels, unmountInactive);
  }, [panels, syncPanels, unmountInactive]);

  if (process.env.NODE_ENV === 'development' && activeTabId) {
    const hasPanel = panels.some(panel => panel.id === activeTabId);
    if (!hasPanel) {
      // eslint-disable-next-line no-console
      console.warn(`[TabPanels] No panel with id "${activeTabId}" in group "${groupId}"`);
    }
  }

  return (
    <div className={className}>
      {panels.map(panel => {
        const isActive = panel.id === activeTabId;

        if (!isActive && unmountInactive) {
          return null;
        }

        return (
          <div
            key={panel.id}
            role="tabpanel"
            id={`${groupId}-panel-${panel.id}`}
            aria-labelledby={`${groupId}-tab-${panel.id}`}
            className={`w-full h-full focus:outline-hidden ${isActive ? '' : 'hidden'}`}
            hidden={!isActive}
          >
            {panel.children}
          </div>
        );
      })}
    </div>
  );
};

export type { TabPanelsProps };
export { TabPanels };
