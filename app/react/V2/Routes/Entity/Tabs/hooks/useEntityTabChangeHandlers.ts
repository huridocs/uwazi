import { useCallback } from 'react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { MAIN_TAB, isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';

type Params = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  activeMainTab: MainTabId;
  hashParams: URLSearchParams;
};

const useEntityTabChangeHandlers = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  activeMainTab,
  hashParams,
}: Params) => {
  const updateEntityUrl = useUpdateEntityUrl();

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;

      updateEntityUrl({
        search: next => {
          if (selectedMainTab === MAIN_TAB.DOCUMENT && hasMainDocument) {
            next.delete(MAIN_TAB_PARAM);
          } else {
            next.set(MAIN_TAB_PARAM, selectedMainTab);
          }
        },
        hash: next => {
          if (selectedMainTab === activeMainTab) return;
          const nextSideButtons = getSideTabButtons({
            activeMainTab: selectedMainTab,
            entity,
            hasMainDocument,
            mainDocumentId,
            filesSideTabs,
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
    ]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      updateEntityUrl({
        search: next => {
          if (!next.get(MAIN_TAB_PARAM) && activeMainTab !== MAIN_TAB.DOCUMENT) {
            next.set(MAIN_TAB_PARAM, activeMainTab);
          }
        },
        hash: next => {
          next.set(SIDE_TAB_PARAM, selectedSideTab);
        },
      });
    },
    [activeMainTab, updateEntityUrl]
  );

  return { onMainTabChange, onSideTabChange };
};

export { useEntityTabChangeHandlers };
