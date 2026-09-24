import React, { useEffect } from 'react';
import { WarmSelect } from '../WarmSelect.js';
import { useTabGroup } from './useTabGroup.js';
import { useStripFold } from './useStripFold.js';
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
  syncActiveTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabListAriaLabel?: string;
};

const TabButtons = ({
  groupId,
  buttons,
  activeTabId,
  syncActiveTabId,
  onTabChange,
  className,
  tabListClassName,
  tabListAriaLabel,
}: TabButtonsProps) => {
  const { activeTabId: atomActiveTabId, syncButtons, selectTab } = useTabGroup(groupId);
  const displayActiveTabId = activeTabId ?? atomActiveTabId;
  const atomSyncTabId = syncActiveTabId ?? activeTabId;
  const totalTabs = buttons.length;
  const { availRef, probeRef, folded } = useStripFold(
    buttons.map(button => `${button.id}:${button.name ?? ''}`).join('|')
  );
  const selectValue = displayActiveTabId || buttons[0]?.id || '';

  useEffect(() => {
    syncButtons(buttons, atomSyncTabId);
  }, [atomSyncTabId, buttons, syncButtons]);

  if (totalTabs === 0) {
    return null;
  }

  return (
    <div
      ref={availRef}
      data-strip="avail"
      className={[
        'relative min-w-0 w-full',
        folded ? '' : tabListScrollClass,
        tabListClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="tabs-comp"
    >
      {folded ? (
        <>
          <div className="sr-only">
            {buttons.map(button => (
              <span key={button.id} id={`${groupId}-tab-${button.id}`}>
                {button.name ?? button.id}
              </span>
            ))}
          </div>
          <WarmSelect
            value={selectValue}
            ariaLabel={tabListAriaLabel}
            options={buttons.map(button => ({
              value: button.id,
              label: button.name ?? button.id,
            }))}
            onChange={tabId => {
              selectTab(tabId);
              onTabChange?.(tabId);
            }}
          />
        </>
      ) : (
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
                className={[
                  tabTriggerBaseClass,
                  getTabShapeClass(index, totalTabs),
                  getTabDividerClass(index),
                  selected ? activeClass : inactiveClass,
                ].join(' ')}
                onClick={() => {
                  selectTab(button.id);
                  onTabChange?.(button.id);
                }}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      )}
      <div ref={probeRef} data-strip="probe" className="invisible absolute top-0 w-max" aria-hidden>
        <div className={tabListClass}>
          {buttons.map(button => (
            <span key={button.id} className={tabTriggerBaseClass}>
              {button.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { TabButtonsProps };
export { TabButtons };
