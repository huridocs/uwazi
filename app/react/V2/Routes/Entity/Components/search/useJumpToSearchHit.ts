import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { useEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import { MAIN_TAB, SIDE_TAB, type MainTabId } from '../../Tabs/tabIds.js';
import {
  esFieldToFocusKey,
  focusMetadataFieldAtom,
} from '#V2/Components/Metadata/focusMetadataFieldAtom.js';

const useJumpToSearchHit = () => {
  const setFocusField = useSetAtom(focusMetadataFieldAtom);
  const { selectTab: selectMainTab } = useTabGroup('entity-main');
  const { selectTab: selectSideTab } = useTabGroup('entity-side');
  const updateEntityUrl = useUpdateEntityUrl();
  const { mainDocument } = useEntityLanguage();
  const hasMainDocument = Boolean(mainDocument?.filename);

  const ensureMainTab = useCallback(
    (mainTab: MainTabId, options?: { hash?: (params: URLSearchParams) => void }) => {
      selectMainTab(mainTab);
      selectSideTab(SIDE_TAB.SEARCH);
      updateEntityUrl({
        search: next => {
          if (mainTab === MAIN_TAB.DOCUMENT && hasMainDocument) {
            next.delete(MAIN_TAB_PARAM);
          } else {
            next.set(MAIN_TAB_PARAM, mainTab);
          }
        },
        hash: next => {
          next.set(SIDE_TAB_PARAM, SIDE_TAB.SEARCH);
          options?.hash?.(next);
        },
      });
    },
    [hasMainDocument, selectMainTab, selectSideTab, updateEntityUrl]
  );

  const jumpToProperty = useCallback(
    (esField: string) => {
      setFocusField({ fieldKey: esFieldToFocusKey(esField) });
      ensureMainTab(MAIN_TAB.METADATA);
    },
    [ensureMainTab, setFocusField]
  );

  return { ensureMainTab, jumpToProperty };
};

export { useJumpToSearchHit };
