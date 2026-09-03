import { useCallback, useMemo } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import {
  EMPTY_TAB_GROUP,
  createEmptyGroup,
  mergeTabGroup,
  resolveActiveTabId,
  tabGroupsAtom,
  type TabButtonDef,
  type TabPanelDef,
} from './tabsAtoms.js';

const useTabGroup = (groupId: string) => {
  const groupAtom = useMemo(
    () => atom(get => get(tabGroupsAtom)[groupId] ?? EMPTY_TAB_GROUP),
    [groupId]
  );
  const group = useAtomValue(groupAtom);
  const setGroups = useSetAtom(tabGroupsAtom);

  const mergeGroup = useCallback(
    (patch: Parameters<typeof mergeTabGroup>[2]) => {
      setGroups(prev => mergeTabGroup(prev, groupId, patch));
    },
    [groupId, setGroups]
  );

  const syncButtons = useCallback(
    (buttons: TabButtonDef[], activeTabId?: string) => {
      setGroups(prev => {
        const current = prev[groupId] ?? createEmptyGroup();
        const nextActive = resolveActiveTabId({ ...current, buttons }, activeTabId);
        return mergeTabGroup(prev, groupId, { buttons, activeTabId: nextActive });
      });
    },
    [groupId, setGroups]
  );

  const syncPanels = useCallback(
    (panels: TabPanelDef[], unmountInactive?: boolean) => {
      mergeGroup({
        panels,
        ...(unmountInactive !== undefined ? { unmountInactive } : {}),
      });
    },
    [mergeGroup]
  );

  const selectTab = useCallback(
    (tabId: string) => {
      mergeGroup({ activeTabId: tabId });
    },
    [mergeGroup]
  );

  return {
    activeTabId: group.activeTabId,
    buttons: group.buttons,
    panels: group.panels,
    unmountInactive: group.unmountInactive,
    syncButtons,
    syncPanels,
    selectTab,
  };
};

export { useTabGroup };
