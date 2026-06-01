import type React from 'react';
import { atom } from 'jotai';

type TabButtonDef = {
  id: string;
  label: React.ReactNode;
};

type TabPanelDef = {
  id: string;
  children: React.ReactNode;
};

type TabGroupState = {
  activeTabId: string;
  buttons: TabButtonDef[];
  panels: TabPanelDef[];
  unmountInactive: boolean;
};

type TabGroupsState = Record<string, TabGroupState>;

const createEmptyGroup = (): TabGroupState => ({
  activeTabId: '',
  buttons: [],
  panels: [],
  unmountInactive: true,
});

const tabGroupsAtom = atom<TabGroupsState>({});

type TabGroupPatch = Partial<Omit<TabGroupState, 'buttons' | 'panels'>> & {
  buttons?: TabButtonDef[];
  panels?: TabPanelDef[];
};

const mergeTabGroup = (
  groups: TabGroupsState,
  groupId: string,
  patch: TabGroupPatch
): TabGroupsState => {
  const current = groups[groupId] ?? createEmptyGroup();
  return {
    ...groups,
    [groupId]: {
      ...current,
      ...patch,
      buttons: patch.buttons ?? current.buttons,
      panels: patch.panels ?? current.panels,
    },
  };
};

const resolveActiveTabId = (
  group: TabGroupState,
  activeTabId: string | undefined
): string => {
  if (activeTabId !== undefined) {
    return activeTabId;
  }
  if (group.activeTabId && group.buttons.some(button => button.id === group.activeTabId)) {
    return group.activeTabId;
  }
  return group.buttons[0]?.id ?? '';
};

export type { TabButtonDef, TabPanelDef, TabGroupState, TabGroupsState, TabGroupPatch };
export { tabGroupsAtom, createEmptyGroup, mergeTabGroup, resolveActiveTabId };
