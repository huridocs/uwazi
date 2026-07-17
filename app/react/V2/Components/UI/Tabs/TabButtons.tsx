import React, { useEffect } from 'react';
import { useTabGroup } from './useTabGroup.js';
import {
  activeClass,
  inactiveClass,
  tabListScrollClass,
  tabListClass,
  tabTriggerBaseClass,
  getTabDividerClass,
  getTabShapeClass,
} from './tabButtonStyles.js';
import type { TabButtonDef } from './tabsAtoms.js';

type TabButtonsProps = {
  groupId: string;
  buttons: TabButtonDef[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabListAriaLabel?: string;
};

const TabButtons = ({
  groupId,
  buttons,
  activeTabId,
  onTabChange,
  className,
  tabListClassName,
  tabListAriaLabel,
}: TabButtonsProps) => {
  const { activeTabId: atomActiveTabId, syncButtons, selectTab } = useTabGroup(groupId);
  const displayActiveTabId = activeTabId ?? atomActiveTabId;
  const totalTabs = buttons.length;

  useEffect(() => {
    syncButtons(buttons, activeTabId);
  }, [activeTabId, buttons, syncButtons]);

  if (totalTabs === 0) {
    return null;
  }

  return (
    <div
      className={[tabListScrollClass, tabListClassName, className].filter(Boolean).join(' ')}
      data-testid="tabs-comp"
    >
      <div className={tabListClass} role="tablist" aria-label={tabListAriaLabel}>
        {buttons.map((button, index) => {
          const selected = button.id === displayActiveTabId;

          return (
            <button
              key={button.id}
              type="button"
              role="tab"
              id={`${groupId}-tab-${button.id}`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${button.id}`}
              tabIndex={selected ? 0 : -1}
              className={[
                tabTriggerBaseClass,
                getTabShapeClass(index, totalTabs),
                getTabDividerClass(index),
                selected ? activeClass : inactiveClass,
              ].join(' ')}
              onClick={() => {
                if (activeTabId === undefined) {
                  selectTab(button.id);
                }
                onTabChange?.(button.id);
              }}
            >
              {button.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export type { TabButtonsProps };
export { TabButtons };
