/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { localeAtom } from '#V2/atoms/index.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import {
  SearchHintsModal,
  EntityScopedProvider,
  EntityFilesProvider,
  EntityMainPaneHeader,
  FilesDeleteConfirmationModal,
  AddFileModal,
  useEntityFiles,
  useEntityScopedEntity,
  useEntityLanguage,
  useMetadataEditing,
} from './Components/index.js';
import { CreateRelationshipModal } from './Components/relationships/create-reference/CreateRelationshipModal.js';
import {
  TabsMainButtons,
  MainTabsContent,
  MainTabsFooters,
  SideTabsPanel,
  MAIN_TAB,
} from './Tabs/index.js';
import { useEntityViewTabs } from './Tabs/hooks/useEntityViewTabs.js';
import { LoaderResponse } from './types.js';

type EntityViewProps = {
  searchResults?: SnippetsSearchResponse;
};

const EntityCreateRelationshipModal = () => {
  const { mainDocument } = useEntityLanguage();
  return <CreateRelationshipModal mainDocument={mainDocument} />;
};

const EntityFilesFromEntity = ({ children }: { children: React.ReactNode }) => {
  const entity = useEntityScopedEntity();
  return <EntityFilesProvider entity={entity}>{children}</EntityFilesProvider>;
};

const EntityView = ({ searchResults }: EntityViewProps) => {
  const entity = useEntityScopedEntity();
  const { mainDocument, pagePlaintext, isRtl } = useEntityLanguage();
  const { focusedRow, primaryRows } = useEntityFiles();
  const hasMainDocument = Boolean(mainDocument?.filename);

  const filesSideTabs = useMemo(
    () => ({
      showTranslationsTab: focusedRow?.category === 'primary',
      translationsCount: primaryRows.length,
    }),
    [focusedRow?.category, primaryRows.length]
  );

  const { activeMainTab, activeSideTab, onMainTabChange, onSideTabChange } = useEntityViewTabs({
    entity,
    hasMainDocument,
    searchResults,
    filesSideTabs,
  });
  const { isEditing } = useMetadataEditing();
  const showMainPaneHeader = !(activeMainTab === MAIN_TAB.METADATA && isEditing);

  return (
    <>
      <FilesDeleteConfirmationModal />
      <AddFileModal />
      <div className="h-full min-h-0" dir={isRtl ? 'rtl' : 'ltr'}>
        <PaneLayout defaultRatios={[0.62, 0.38]} className="bg-parchment text-ink">
          <PaneLayout.Pane>
            <div
              className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
              data-testid="entity-v2"
            >
              <div className="shrink-0">
                <div className="px-4 py-2 md:py-2.5">
                  <TabsMainButtons
                    entity={entity}
                    mainDocument={mainDocument}
                    activeTabId={activeMainTab}
                    onTabChange={onMainTabChange}
                  />
                </div>
                {showMainPaneHeader ? (
                  <EntityMainPaneHeader
                    entity={entity}
                    showDocumentViewMode={activeMainTab === MAIN_TAB.DOCUMENT && hasMainDocument}
                  />
                ) : null}
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <MainTabsContent
                    activeTabId={activeMainTab}
                    entity={entity}
                    mainDocument={mainDocument}
                    pagePlaintext={pagePlaintext}
                  />
                </div>
                <MainTabsFooters activeTabId={activeMainTab} mainDocument={mainDocument} />
              </div>
            </div>
          </PaneLayout.Pane>
          <PaneLayout.Pane key={activeMainTab}>
            <SideTabsPanel
              activeMainTab={activeMainTab}
              activeSideTab={activeSideTab}
              onSideTabChange={onSideTabChange}
              entity={entity}
              mainDocument={mainDocument}
              pagePlaintext={pagePlaintext}
              filesSideTabs={filesSideTabs}
            />
          </PaneLayout.Pane>
        </PaneLayout>
      </div>
    </>
  );
};

const Entity = () => {
  const loaderData = useLoaderData<LoaderResponse>();
  const locale = useAtomValue(localeAtom);
  const entity = loaderData?.entity;
  const mainDocument = loaderData?.mainDocument;
  const pagePlaintext = loaderData?.pagePlaintext;
  const searchResults = loaderData?.searchResults;
  const language = entity?.language || locale;

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <ThemeProvider className="h-full min-h-0">
      <EntityScopedProvider
        key={entity.sharedId}
        entity={entity}
        language={language}
        mainDocument={mainDocument}
        pagePlaintext={pagePlaintext}
      >
        <EntityFilesFromEntity>
          <EntityView searchResults={searchResults} />
        </EntityFilesFromEntity>
        <SearchHintsModal />
        <EntityCreateRelationshipModal />
      </EntityScopedProvider>
    </ThemeProvider>
  );
};

export { Entity };
