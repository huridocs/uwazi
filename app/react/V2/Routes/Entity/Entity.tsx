/* eslint-disable react/no-multi-comp */
import React, { useLayoutEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useLoaderData } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { BlockDirtyNavigation, useTabGroup } from '#V2/Components/UI/index.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { localeAtom } from '#V2/atoms/index.js';
import { entityDisplayModeAtom } from './entityDisplayModeAtom.js';
import { PublishedViewToggle } from './PublishedViewToggle.js';
import {
  EntityScopedProvider,
  EntityFilesProvider,
  EntityMainPaneHeader,
  EntitySeo,
  FilesDeleteConfirmationModal,
  AddFileModal,
  useEntityFiles,
  useEntityScopedEntity,
  useEntityLanguage,
  useEntityPageView,
  useMetadataEditing,
  EntityPageViewer,
} from './Components/index.js';
import { useEntityOverlayTarget } from './Components/context/index.js';
import { EntityOverlay } from './Components/relationships/overlay/EntityOverlay.js';
import { useRevealSidePane } from './Components/relationships/overlay/useRevealSidePane.js';
import { CreateRelationshipModal } from './Components/relationships/create-reference/CreateRelationshipModal.js';
import { ManageRelationTypesModal } from './Components/relationships/create-reference/ManageRelationTypesModal.js';
import { useResetRelationshipsOnDocumentChange } from './Components/relationships/hooks/useDocumentRelationships.js';
import {
  TabsMainButtons,
  MainTabsContent,
  MainTabsFooters,
  SideTabsPanel,
  MAIN_TAB,
  isValidMainTab,
} from './Tabs/index.js';
import { EntityMainTabsProvider, useEntityTabNavigation } from './Tabs/EntityTabsContext.js';
import { translationsFilesSideTabs } from './Tabs/sideTabSets.js';
import { useEntityMainTabs } from './Tabs/hooks/useEntityMainTabs.js';
import { LoaderResponse } from './types.js';
import { EntityUrlSync } from './entityUrlState.js';

const EntityCreateRelationshipModal = () => {
  const { mainDocument } = useEntityLanguage();
  return <CreateRelationshipModal mainDocument={mainDocument} />;
};

const EntityFilesFromEntity = React.memo(({ children }: { children: React.ReactNode }) => {
  const entity = useEntityScopedEntity();
  return <EntityFilesProvider entity={entity}>{children}</EntityFilesProvider>;
});

const EntityMainColumn = React.memo(() => {
  const entity = useEntityScopedEntity();
  const { mainDocument, pagePlaintext } = useEntityLanguage();
  const { onMainTabChange, activeMainTab } = useEntityTabNavigation();
  const { activeTabId: atomMainTabId } = useTabGroup('entity-main');
  const hasMainDocument = Boolean(mainDocument?.filename);
  const mainTabId = isValidMainTab(atomMainTabId) ? atomMainTabId : activeMainTab;
  const { isEditing, formMountHost } = useMetadataEditing();
  const showMainPaneHeader = !(
    mainTabId === MAIN_TAB.METADATA &&
    isEditing &&
    formMountHost === 'main'
  );

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
      data-testid="entity-v2"
    >
      <div className="shrink-0">
        <div className="px-3 pt-2 pb-1 md:pt-2.5">
          <TabsMainButtons
            entity={entity}
            mainDocument={mainDocument}
            onTabChange={onMainTabChange}
          />
        </div>
        {showMainPaneHeader ? (
          <EntityMainPaneHeader
            entity={entity}
            showDocumentViewMode={mainTabId === MAIN_TAB.DOCUMENT && hasMainDocument}
          />
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <MainTabsContent
            activeTabId={mainTabId}
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        </div>
        <MainTabsFooters activeTabId={mainTabId} mainDocument={mainDocument} />
      </div>
    </div>
  );
});

const useEntityMobileOverlay = (showSidePane: () => void) => {
  const { target } = useEntityOverlayTarget();
  const isMobile = useIsMobile();
  useRevealSidePane(!isMobile && target !== null, showSidePane);
  return isMobile;
};

const EntityView = () => {
  const entity = useEntityScopedEntity();
  const { mainDocument, pagePlaintext } = useEntityLanguage();
  useResetRelationshipsOnDocumentChange();
  const { primaryRows } = useEntityFiles();
  const hasMainDocument = Boolean(mainDocument?.filename);
  const filesSideTabs = useMemo(
    () => translationsFilesSideTabs(primaryRows.length),
    [primaryRows.length]
  );
  const entityTabs = useEntityMainTabs({
    entity,
    hasMainDocument,
    mainDocumentId: mainDocument?._id,
    filesSideTabs,
  });
  const isMobile = useEntityMobileOverlay(entityTabs.showSidePane);
  const { isDirty, isSaving, isEditing, cancelEdit } = useMetadataEditing();

  return (
    <EntityMainTabsProvider value={entityTabs}>
      <FilesDeleteConfirmationModal />
      <AddFileModal />
      <BlockDirtyNavigation when={isEditing && (isDirty || isSaving)} onDiscard={cancelEdit} />
      <div className="h-full min-h-0 flex-1">
        <PaneLayout
          defaultRatios={[0.637, 0.363]}
          className="bg-parchment text-ink"
          requestedPane={entityTabs.requestedPane}
        >
          <PaneLayout.Pane>
            <EntityMainColumn />
          </PaneLayout.Pane>
          <PaneLayout.Pane key="entity-side-pane">
            <SideTabsPanel
              entity={entity}
              mainDocument={mainDocument}
              pagePlaintext={pagePlaintext}
            />
          </PaneLayout.Pane>
        </PaneLayout>
        {isMobile ? <EntityOverlay /> : null}
      </div>
    </EntityMainTabsProvider>
  );
};

const EntityRouteBody = () => {
  const entity = useEntityScopedEntity();
  const { isRtl } = useEntityLanguage();
  const { hasEntityPageView } = useEntityPageView();
  const mode = useAtomValue(entityDisplayModeAtom);
  const setMode = useSetAtom(entityDisplayModeAtom);
  const sharedId = entity?.sharedId;

  useLayoutEffect(() => {
    setMode('published');
  }, [sharedId, setMode]);

  const showPublished = hasEntityPageView && mode === 'published';

  return (
    <div className="flex h-full min-h-0 flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <EntitySeo entity={entity} />
      {showPublished ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <EntityPageViewer />
        </div>
      ) : (
        <EntityView />
      )}
      <PublishedViewToggle />
    </div>
  );
};

const Entity = () => {
  const loaderData = useLoaderData<LoaderResponse>();
  const locale = useAtomValue(localeAtom);
  const entity = loaderData?.entity;
  const mainDocument = loaderData?.mainDocument;
  const pagePlaintext = loaderData?.pagePlaintext;
  const entityPageView = loaderData?.entityPageView;
  const language = entity?.language || locale;

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <ThemeProvider className="h-full min-h-0">
      <EntityUrlSync>
        <EntityScopedProvider
          key={entity.sharedId}
          entity={entity}
          language={language}
          mainDocument={mainDocument}
          pagePlaintext={pagePlaintext}
          entityPageView={entityPageView}
          relationshipQuery={loaderData?.relationshipQuery}
        >
          <EntityFilesFromEntity>
            <EntityRouteBody />
          </EntityFilesFromEntity>
          <EntityCreateRelationshipModal />
          <ManageRelationTypesModal />
        </EntityScopedProvider>
      </EntityUrlSync>
    </ThemeProvider>
  );
};

export { Entity };
