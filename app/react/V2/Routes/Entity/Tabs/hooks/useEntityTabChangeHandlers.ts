import { useCallback } from 'react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { SIDE_TAB_PARAM } from '../../urlParams.js';
import { applyMainTabSearchParam } from '../applyMainTabSearchParam.js';
import { setEntitySideTabInUrl } from '../setEntitySideTabInUrl.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';

type Params = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  activeMainTab: MainTabId;
  hashParams: URLSearchParams;
  relationshipsCount: number;
};

const useEntityTabChangeHandlers = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  activeMainTab,
  hashParams,
  relationshipsCount,
}: Params) => {
  const updateEntityUrl = useUpdateEntityUrl();

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;

      updateEntityUrl({
        search: next => applyMainTabSearchParam(next, selectedMainTab, hasMainDocument),
        hash: next => {
          if (selectedMainTab === activeMainTab) return;
          const nextSideButtons = getSideTabButtons({
            activeMainTab: selectedMainTab,
            entity,
            hasMainDocument,
            mainDocumentId,
            filesSideTabs,
            relationshipsCount,
          });
          const rawS = hashParams.get(SIDE_TAB_PARAM);
          const sStillValid =
            Boolean(rawS) &&
            isValidSideTab(rawS) &&
            nextSideButtons.some(button => button.id === rawS);
          if (!sStillValid) {
            next.delete(SIDE_TAB_PARAM);
          }
        },
      });
    },
    [
      activeMainTab,
      updateEntityUrl,
      hashParams,
      entity,
      hasMainDocument,
      mainDocumentId,
      filesSideTabs,
      relationshipsCount,
    ]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      setEntitySideTabInUrl(updateEntityUrl, activeMainTab, selectedSideTab);
    },
    [activeMainTab, updateEntityUrl]
  );

  return { onMainTabChange, onSideTabChange };
};

export { useEntityTabChangeHandlers };
