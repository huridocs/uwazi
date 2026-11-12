import React, { useEffect, type ReactNode } from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useMetadataEditing } from '../Components/context/index.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, type SideTabId } from './tabIds.js';
import { MAIN_TAB_PAPER_PADDING, mainTabPanelSurfaceClass } from './tabSurface.js';
import { keepMetadataTab } from '../Components/context/metadataEditingSession.js';
import { useResolvedEntityMainTab } from './hooks/useResolvedEntityMainTab.js';
import { useRegisterDocumentHighlight } from '../Components/document/documentHighlightGate.js';
import { useEntityTabNavigation } from './EntityTabsContext.js';
import { DocumentTab } from './tabsContent/DocumentTab.js';
import { MetadataTab } from './tabsContent/MetadataTab.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '../Components/relationships/index.js';
import { DrawerFilesList } from '../Components/Files/DrawerFilesList.js';
import { FilesTab } from './tabsContent/FilesTab.js';
import { ToCTab } from './tabsContent/ToCTab.js';
import { SearchTab } from './tabsContent/SearchTab.js';
import { FilesSideTab } from './tabsContent/FilesSideTab.js';
import { TranslationsTab } from './tabsContent/TranslationsTab.js';

type FilesLayout = 'table' | 'drawer';

type MainTabsContentProps = {
  activeTabId: SideTabId;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  groupId?: string;
  filesLayout?: FilesLayout;
  revealTocDocument?: boolean;
};

const mainTabSwitchContent = ({
  activeTabId,
  relationshipsOnMain,
  focusDocumentPanel,
  filesLayout,
}: {
  activeTabId: SideTabId;
  relationshipsOnMain: boolean;
  focusDocumentPanel: () => void;
  filesLayout: FilesLayout;
}): ReactNode => {
  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      return null;
    case MAIN_TAB.METADATA:
      return null;
    case MAIN_TAB.RELATIONSHIPS:
      return (
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${MAIN_TAB_PAPER_PADDING}`}>
          <RelationshipsPanel
            focusDocumentOnSelect={relationshipsOnMain}
            onFocusDocument={focusDocumentPanel}
          />
        </div>
      );
    case MAIN_TAB.FILES:
      return filesLayout === 'drawer' ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-warm">
          <DrawerFilesList />
        </div>
      ) : (
        <FilesTab />
      );
    default:
      return null;
  }
};

const companionContent = (
  activeTabId: SideTabId,
  mainDocument: FileType | undefined,
  onRevealDocument?: () => void
) => {
  switch (activeTabId) {
    case SIDE_TAB.TOC:
      return <ToCTab mainDocument={mainDocument} onRevealDocument={onRevealDocument} />;
    case SIDE_TAB.SEARCH:
      return <SearchTab />;
    case SIDE_TAB.FILE:
      return <FilesSideTab />;
    case SIDE_TAB.TRANSLATIONS:
      return <TranslationsTab />;
    default:
      return null;
  }
};

const keepsDocumentMounted = (activeTabId: SideTabId, retainOnRelationships: boolean) =>
  activeTabId === MAIN_TAB.DOCUMENT ||
  activeTabId === SIDE_TAB.TOC ||
  activeTabId === SIDE_TAB.SEARCH ||
  (retainOnRelationships && activeTabId === MAIN_TAB.RELATIONSHIPS);

const useLibraryDocumentPaint = (activeTabId: SideTabId, revealDocument: boolean) => {
  const register = useRegisterDocumentHighlight();
  useEffect(() => {
    if (!revealDocument || !register) return undefined;
    register('library-document', activeTabId === MAIN_TAB.DOCUMENT);
    return () => register('library-document', null);
  }, [activeTabId, register, revealDocument]);
};

const useMainTabsPanel = ({
  activeTabId: urlActiveTabId,
  groupId,
  filesLayout = 'table',
}: MainTabsContentProps) => {
  const resolvedMainTab = useResolvedEntityMainTab(
    isValidMainTab(urlActiveTabId) ? urlActiveTabId : MAIN_TAB.METADATA,
    groupId
  );
  const activeTabId = isValidMainTab(urlActiveTabId) ? resolvedMainTab : urlActiveTabId;
  const { focusDocumentPanel, relationshipsOnMain } = useEntityTabNavigation();
  const { isEditing, formMountHost, registerMetadataActive } = useMetadataEditing();
  const metadataActive = activeTabId === MAIN_TAB.METADATA;
  useEffect(() => {
    registerMetadataActive('main', metadataActive);
    return () => registerMetadataActive('main', false);
  }, [metadataActive, registerMetadataActive]);
  return {
    activeTabId,
    metadataActive,
    showMetadataOnMain: keepMetadataTab(metadataActive, isEditing, formMountHost, 'main'),
    content: isValidMainTab(activeTabId)
      ? mainTabSwitchContent({
          activeTabId,
          relationshipsOnMain,
          focusDocumentPanel,
          filesLayout,
        })
      : null,
  };
};

const mountedMainPanels = (
  props: MainTabsContentProps,
  showMetadata: boolean,
  metadataActive: boolean
) => {
  const documentVisible = props.activeTabId === MAIN_TAB.DOCUMENT;
  const { mainDocument } = props;
  const documentNode =
    mainDocument?.filename &&
    keepsDocumentMounted(props.activeTabId, Boolean(props.revealTocDocument)) ? (
      <div className={documentVisible ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col' : 'hidden'}>
        <DocumentTab
          entity={props.entity}
          mainDocument={mainDocument}
          pagePlaintext={props.pagePlaintext}
        />
      </div>
    ) : null;
  const metadataNode = showMetadata ? (
    <div className={metadataActive ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
      <MetadataTab entity={props.entity} host="main" />
    </div>
  ) : null;
  return { documentVisible, documentNode, metadataNode };
};

const MainTabsContentComponent = (props: MainTabsContentProps) => {
  const panel = useMainTabsPanel(props);
  useLibraryDocumentPaint(props.activeTabId, Boolean(props.revealTocDocument));
  const { focusDocumentPanel } = useEntityTabNavigation();
  const companion = companionContent(
    props.activeTabId,
    props.mainDocument,
    props.revealTocDocument ? focusDocumentPanel : undefined
  );
  const panelGroupId = props.groupId ?? 'entity-main';
  const { documentVisible, documentNode, metadataNode } = mountedMainPanels(
    props,
    panel.showMetadataOnMain,
    panel.metadataActive
  );
  const tabId = companion ? props.activeTabId : panel.activeTabId;
  if (!companion && !documentNode && !metadataNode && !panel.content) return null;
  return (
    <div
      role="tabpanel"
      id={`${panelGroupId}-panel-${tabId}`}
      aria-labelledby={`${panelGroupId}-tab-${tabId}`}
      className={`flex h-full min-h-0 w-full flex-col ${
        companion ? '' : mainTabPanelSurfaceClass(panel.activeTabId, panel.metadataActive)
      }`}
    >
      {documentNode}
      {metadataNode}
      {companion}
      {!companion && !documentVisible && !panel.metadataActive ? panel.content : null}
      {!companion && panel.activeTabId === MAIN_TAB.RELATIONSHIPS ? (
        <RelationshipsFiltersDrawer />
      ) : null}
    </div>
  );
};

const MainTabsContent = React.memo(MainTabsContentComponent);

export { MainTabsContent };
