import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import type { FilesSideTabsOptions } from '../sideTabSets.js';
import { useEntityTabChangeHandlers } from './useEntityTabChangeHandlers.js';
import { useEntityTabUrlSync } from './useEntityTabUrlSync.js';
import { useResolvedEntityTabs } from './useResolvedEntityTabs.js';

type UseEntityViewTabsParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  searchResults?: SnippetsSearchResponse;
  filesSideTabs: FilesSideTabsOptions;
};

const useEntityViewTabs = (params: UseEntityViewTabsParams) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const tabs = useResolvedEntityTabs({ ...params, searchParams });

  useEntityTabUrlSync({
    ...params,
    ...tabs,
    searchParams,
    setSearchParams,
    setTabGroups,
  });

  const handlers = useEntityTabChangeHandlers({
    ...params,
    activeMainTab: tabs.activeMainTab,
    setSearchParams,
  });

  return {
    activeMainTab: tabs.activeMainTab,
    activeSideTab: tabs.activeSideTab,
    ...handlers,
  };
};

export { useEntityViewTabs };
