import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { useEntityLanguage } from '#V2/Routes/Entity/Components/index.js';
import { useEntityOverlayTarget } from '#V2/Routes/Entity/Components/context/EntityOverlayContext.js';
import { pickMainTab } from '#V2/Routes/Entity/Tabs/entityTabState.js';
import { MAIN_TAB } from '#V2/Routes/Entity/Tabs/index.js';
import { focusMetadataFieldAtom } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';

const usePreviewFieldFocus = (sharedId: string, focusFieldKey?: string) => {
  const { selectTab } = useTabGroup('entity-main');
  const setFocusField = useSetAtom(focusMetadataFieldAtom);
  useEffect(() => {
    if (!focusFieldKey) return undefined;
    selectTab(MAIN_TAB.METADATA);
    setFocusField({ fieldKey: focusFieldKey });
    return undefined;
  }, [focusFieldKey, selectTab, setFocusField, sharedId]);
};

const usePreviewEscape = (onClose: () => void) => {
  const { target } = useEntityOverlayTarget();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || target) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, target]);
};

const useLibraryPreviewTab = () => {
  const { mainDocument } = useEntityLanguage();
  const hasMainDocument = Boolean(mainDocument?.filename);
  const { activeTabId: atomMainTabId } = useTabGroup('entity-main');
  return pickMainTab(atomMainTabId, hasMainDocument);
};

export { useLibraryPreviewTab, usePreviewEscape, usePreviewFieldFocus };
