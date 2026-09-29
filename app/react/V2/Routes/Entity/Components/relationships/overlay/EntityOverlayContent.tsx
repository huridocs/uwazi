import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityFilesProvider } from '#V2/Routes/Entity/Components/Files/EntityFilesContext.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { pickMainTab } from '#V2/Routes/Entity/Tabs/entityTabState.js';
import {
  EntityMainTabsProvider,
  type EntityMainTabsState,
} from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import {
  MAIN_TAB,
  MainTabsContent,
  TabsMainButtons,
  type MainTabId,
} from '#V2/Routes/Entity/Tabs/index.js';

type EntityOverlayContentProps = {
  entity: Entity;
};

const noop = () => undefined;

const overlayTabs = (mainTabId: MainTabId): EntityMainTabsState => ({
  activeMainTab: mainTabId,
  relationshipsOnMain: mainTabId === MAIN_TAB.RELATIONSHIPS,
  documentOnMain: mainTabId === MAIN_TAB.DOCUMENT,
  onMainTabChange: noop,
  focusSideTab: noop,
  stageSideTab: noop,
  focusRelationshipsPanel: noop,
  focusDocumentPanel: noop,
  showSidePane: noop,
});

const EntityOverlayContent = ({ entity }: EntityOverlayContentProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const mainDocument = getMainDocument(
    readyDocuments(entity.documents),
    entity.language,
    defaultLanguage
  );
  const groupId = `entity-overlay-${entity.sharedId}`;
  const { activeTabId, selectTab } = useTabGroup(groupId);
  const mainTabId = pickMainTab(activeTabId, Boolean(mainDocument?.filename));
  const tabs = useMemo(() => overlayTabs(mainTabId), [mainTabId]);

  return (
    <EntityScopedProvider inheritOverlay entity={entity} language={entity.language || 'en'}>
      <EntityFilesProvider entity={entity}>
        <EntityMainTabsProvider value={tabs}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 px-3 pt-2 pb-1">
              <TabsMainButtons
                groupId={groupId}
                entity={entity}
                mainDocument={mainDocument}
                onTabChange={selectTab}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <MainTabsContent
                groupId={groupId}
                activeTabId={mainTabId}
                entity={entity}
                mainDocument={mainDocument}
              />
            </div>
          </div>
        </EntityMainTabsProvider>
      </EntityFilesProvider>
    </EntityScopedProvider>
  );
};

export { EntityOverlayContent };
