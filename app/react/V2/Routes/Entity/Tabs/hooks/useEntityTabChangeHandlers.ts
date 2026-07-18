import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { getSideTabButtons, type FilesSideTabsOptions } from '../sideTabSets.js';
import { isValidMainTab, isValidSideTab, type MainTabId } from '../tabIds.js';

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

type Params = {
  entity: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs: FilesSideTabsOptions;
  activeMainTab: MainTabId;
  setSearchParams: SetSearchParams;
};

const useEntityTabChangeHandlers = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  activeMainTab,
  setSearchParams,
}: Params) => {
  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (selectedMainTab !== activeMainTab) {
            const nextSideButtons = getSideTabButtons({
              activeMainTab: selectedMainTab,
              entity,
              hasMainDocument,
              mainDocumentId,
              filesSideTabs,
            });
            const rawS = next.get(SIDE_TAB_PARAM);
            const sStillValid =
              Boolean(rawS) &&
              isValidSideTab(rawS) &&
              nextSideButtons.some(button => button.id === rawS);
            if (!sStillValid) next.delete(SIDE_TAB_PARAM);
          }
          next.set(MAIN_TAB_PARAM, selectedMainTab);
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [activeMainTab, setSearchParams, entity, hasMainDocument, mainDocumentId, filesSideTabs]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set(SIDE_TAB_PARAM, selectedSideTab);
          if (!next.get(MAIN_TAB_PARAM)) next.set(MAIN_TAB_PARAM, activeMainTab);
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [activeMainTab, setSearchParams]
  );

  return { onMainTabChange, onSideTabChange };
};

export { useEntityTabChangeHandlers };
