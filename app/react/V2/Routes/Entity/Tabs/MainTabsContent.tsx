import React, { useEffect, type ReactNode } from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import {
  useMetadataEditing,
  useEntityPageView,
  EntityPageViewer,
} from '../Components/context/index.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';
import { keepMetadataTab } from '../Components/context/metadataEditingSession.js';
import { useResolvedEntityMainTab } from './hooks/useResolvedEntityMainTab.js';
import { useEntityTabNavigation } from './EntityTabsContext.js';
import { DocumentTab } from './tabsContent/DocumentTab.js';
import { MetadataTab } from './tabsContent/MetadataTab.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '../Components/relationships/index.js';
import { FilesTab } from './tabsContent/FilesTab.js';

type MainTabsContentProps = {
  activeTabId: MainTabId;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

const mainTabSwitchContent = ({
  activeTabId,
  entity,
  mainDocument,
  pagePlaintext,
  relationshipsOnMain,
  focusDocumentPanel,
}: MainTabsContentProps & {
  relationshipsOnMain: boolean;
  focusDocumentPanel: () => void;
}): ReactNode => {
  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      return mainDocument?.filename ? (
        <DocumentTab entity={entity} mainDocument={mainDocument} pagePlaintext={pagePlaintext} />
      ) : null;
    case MAIN_TAB.METADATA:
      return null;
    case MAIN_TAB.RELATIONSHIPS:
      return (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
          <RelationshipsPanel
            focusDocumentOnSelect={relationshipsOnMain}
            onFocusDocument={focusDocumentPanel}
          />
        </div>
      );
    case MAIN_TAB.FILES:
      return <FilesTab />;
    default:
      return null;
  }
};

const useMainTabsPanel = ({
  activeTabId: urlActiveTabId,
  entity,
  mainDocument,
  pagePlaintext,
}: MainTabsContentProps) => {
  const activeTabId = useResolvedEntityMainTab(urlActiveTabId);
  const { focusDocumentPanel, relationshipsOnMain } = useEntityTabNavigation();
  const { isEditing, formMountHost, registerMetadataActive } = useMetadataEditing();
  const { hasEntityPageView } = useEntityPageView();
  const metadataActive = activeTabId === MAIN_TAB.METADATA;
  useEffect(() => {
    registerMetadataActive('main', metadataActive && !hasEntityPageView);
    return () => registerMetadataActive('main', false);
  }, [metadataActive, hasEntityPageView, registerMetadataActive]);
  return {
    activeTabId,
    metadataActive,
    // When the template uses an entity view page, the main Metadata tab shows the page
    // instead of MetadataTab. Side panel Metadata is unchanged.
    showEntityPageOnMain: hasEntityPageView && metadataActive,
    showMetadataOnMain:
      keepMetadataTab(metadataActive, isEditing, formMountHost, 'main') && !hasEntityPageView,
    content: mainTabSwitchContent({
      activeTabId,
      entity,
      mainDocument,
      pagePlaintext,
      relationshipsOnMain,
      focusDocumentPanel,
    }),
  };
};

const MainTabsContentComponent = (props: MainTabsContentProps) => {
  const panel = useMainTabsPanel(props);
  if (!panel.content && !panel.showMetadataOnMain && !panel.showEntityPageOnMain) return null;
  return (
    <div
      role="tabpanel"
      id={`entity-main-panel-${panel.activeTabId}`}
      aria-labelledby={`entity-main-tab-${panel.activeTabId}`}
      className={`flex h-full min-h-0 w-full flex-col ${panel.metadataActive ? 'bg-paper' : 'bg-warm'}`}
    >
      {panel.showMetadataOnMain ? (
        <div className={panel.metadataActive ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
          <MetadataTab entity={props.entity} host="main" />
        </div>
      ) : null}
      {panel.showEntityPageOnMain ? <EntityPageViewer /> : null}
      {!panel.metadataActive ? panel.content : null}
      {panel.activeTabId === MAIN_TAB.RELATIONSHIPS && <RelationshipsFiltersDrawer />}
    </div>
  );
};

const MainTabsContent = React.memo(MainTabsContentComponent);

export { MainTabsContent };
