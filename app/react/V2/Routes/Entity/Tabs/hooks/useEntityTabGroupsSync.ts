import { useEffect, useRef } from 'react';
import { mergeTabGroup, type TabGroupsState } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { type SideTabId } from '../tabIds.js';

const writeActiveTab = (groups: TabGroupsState, groupId: string, activeTabId: SideTabId) =>
  groups[groupId]?.activeTabId === activeTabId
    ? groups
    : mergeTabGroup(groups, groupId, { activeTabId });

type UseEntityTabGroupsSyncParams = {
  entity: EntityType;
  activeMainTab: SideTabId;
  activeSideTab: SideTabId;
  pendingLeftTab: SideTabId | null;
  clearPendingSideTab: () => void;
  setTabGroups: (update: (prev: TabGroupsState) => TabGroupsState) => void;
};

const useEntityTabGroupsSync = ({
  entity,
  activeMainTab,
  activeSideTab,
  pendingLeftTab,
  clearPendingSideTab,
  setTabGroups,
}: UseEntityTabGroupsSyncParams) => {
  const previousSharedId = useRef(entity.sharedId);
  const mainId = pendingLeftTab ?? activeMainTab;

  useEffect(() => {
    if (previousSharedId.current === entity.sharedId) return;
    previousSharedId.current = entity.sharedId;
    clearPendingSideTab();
    setTabGroups(prev => {
      const { 'entity-main': _main, 'entity-side': _side, ...rest } = prev;
      return rest;
    });
  }, [clearPendingSideTab, entity.sharedId, setTabGroups]);

  useEffect(() => {
    setTabGroups(prev =>
      writeActiveTab(writeActiveTab(prev, 'entity-main', mainId), 'entity-side', activeSideTab)
    );
  }, [activeSideTab, mainId, setTabGroups]);
};

export { useEntityTabGroupsSync };
