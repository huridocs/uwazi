import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { useEntityTabNavigation } from '../../Tabs/EntityTabsContext.js';
import { MAIN_TAB } from '../../Tabs/tabIds.js';
import {
  esFieldToFocusKey,
  focusMetadataFieldAtom,
} from '#V2/Components/Metadata/focusMetadataFieldAtom.js';

const useJumpToSearchHit = () => {
  const setFocusField = useSetAtom(focusMetadataFieldAtom);
  const { openSearchHit } = useEntityTabNavigation();
  const jumpToProperty = useCallback(
    (esField: string) => {
      setFocusField({ fieldKey: esFieldToFocusKey(esField) });
      openSearchHit(MAIN_TAB.METADATA);
    },
    [openSearchHit, setFocusField]
  );

  return { ensureMainTab: openSearchHit, jumpToProperty };
};

export { useJumpToSearchHit };
