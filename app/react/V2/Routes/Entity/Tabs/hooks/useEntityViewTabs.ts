import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { countEntityRelationships } from '#V2/formatters/index.js';
import { useRelationshipViews } from '../../Components/context/index.js';
import { useEntityHashParams } from '../../entityUrlState.js';
import type { FilesSideTabsOptions } from '../sideTabSets.js';
import { useEntityTabChangeHandlers } from './useEntityTabChangeHandlers.js';
import { useEntityTabUrlSync } from './useEntityTabUrlSync.js';
import { useResolvedEntityTabs } from './useResolvedEntityTabs.js';

type UseEntityViewTabsParams = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
};

const useEntityViewTabs = (params: UseEntityViewTabsParams) => {
  const [searchParams] = useSearchParams();
  const hashParams = useEntityHashParams();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const views = useRelationshipViews();
  const relationshipsCount = countEntityRelationships(
    params.entity.sharedId,
    views,
    params.mainDocumentId
  );
  const withCount = { ...params, relationshipsCount };

  const tabs = useResolvedEntityTabs({ ...withCount, searchParams, hashParams });

  useEntityTabUrlSync({
    ...withCount,
    ...tabs,
    searchParams,
    hashParams,
    setTabGroups,
  });

  const handlers = useEntityTabChangeHandlers({
    ...withCount,
    activeMainTab: tabs.activeMainTab,
    hashParams,
  });

  return {
    activeMainTab: tabs.activeMainTab,
    activeSideTab: tabs.activeSideTab,
    ...handlers,
  };
};

export { useEntityViewTabs };
