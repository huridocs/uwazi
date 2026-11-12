import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { useEntityLanguage, useEntityScopedEntity } from '#V2/Routes/Entity/Components/index.js';
import { useEntityOverlayTarget } from '#V2/Routes/Entity/Components/context/EntityOverlayContext.js';
import { MAIN_TAB } from '#V2/Routes/Entity/Tabs/index.js';
import { resolvePaneTabs } from '#V2/Routes/Entity/Tabs/paneTabSelection.js';
import { pickTabButtons } from '#V2/Routes/Entity/Tabs/sideTabSets.js';
import { useEntitySideButtonModel } from '#V2/Routes/Entity/Tabs/hooks/useEntitySideButtonModel.js';
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

const emptyFilesSideTabs = { showTranslationsTab: false, translationsCount: 0 };

const usePreviewDefaultTab = (entityId: string, hasMainDocument: boolean) => {
  const { activeTabId, selectTab } = useTabGroup('entity-main');
  const defaultTab = hasMainDocument ? MAIN_TAB.DOCUMENT : MAIN_TAB.METADATA;
  const [settledFor, setSettledFor] = useState<string | null>(null);
  useLayoutEffect(() => {
    selectTab(defaultTab);
    setSettledFor(entityId);
  }, [defaultTab, entityId, selectTab]);
  return { activeTabId: settledFor === entityId ? activeTabId : defaultTab, defaultTab };
};

const useLibraryPreviewTab = () => {
  const entity = useEntityScopedEntity();
  const { mainDocument } = useEntityLanguage();
  const hasMainDocument = Boolean(mainDocument?.filename);
  const { catalogFor } = useEntitySideButtonModel({
    entity,
    hasMainDocument,
    mainDocumentId: mainDocument?._id,
    filesSideTabs: emptyFilesSideTabs,
  });
  const { leftIds } = useMemo(
    () =>
      resolvePaneTabs({
        left: null,
        rightFromUrl: null,
        availability: { hasMainDocument, showTranslationsTab: false, hasEntity: true },
      }),
    [hasMainDocument]
  );
  const buttons = useMemo(() => pickTabButtons(catalogFor(false), leftIds), [catalogFor, leftIds]);
  const { activeTabId, defaultTab } = usePreviewDefaultTab(entity.sharedId, hasMainDocument);
  const tabId = leftIds.find(id => id === activeTabId) ?? defaultTab;
  return { tabId, buttons };
};

export { useLibraryPreviewTab, usePreviewEscape, usePreviewFieldFocus };
