/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { FileType } from '#V2/api/entities/types.js';
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
  mainDocument?: FileType;
  pagePlaintext?: string;
  searchResults?: SnippetsSearchResponse;
};

const EntityView = ({ mainDocument, pagePlaintext, searchResults }: EntityViewProps) => {
  const entity = useEntityScopedEntity();
  const { focusedRow, primaryRows } = useEntityFiles();
  const hasMainDocument = Boolean(mainDocument?.filename);
  const filesCount = (entity.documents?.length || 0) + (entity.attachments?.length || 0);

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
    filesCount,
    searchResults,
    filesSideTabs,
  });

  return (
    <>
      <FilesDeleteConfirmationModal />
      <AddFileModal />
      <PaneLayout defaultRatios={[0.62, 0.38]} className="bg-parchment text-ink">
        <PaneLayout.Pane>
          <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border-soft px-3 py-2.5">
              <div className="flex flex-col gap-3">
                <TabsMainButtons
                  entity={entity}
                  mainDocument={mainDocument}
                  activeTabId={activeMainTab}
                  onTabChange={onMainTabChange}
                />
                <EntityMainPaneHeader
                  entity={entity}
                  showDocumentViewMode={activeMainTab === MAIN_TAB.DOCUMENT && hasMainDocument}
                />
              </div>
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
    </>
  );
};

const Entity = () => {
  const loaderData = useLoaderData<LoaderResponse>();
  const entity = loaderData?.entity;
  const mainDocument = loaderData?.mainDocument;
  const pagePlaintext = loaderData?.pagePlaintext;
  const searchResults = loaderData?.searchResults;

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <EntityScopedProvider key={entity.sharedId} entity={entity}>
      <EntityFilesProvider entity={entity}>
        <EntityView
          mainDocument={mainDocument}
          pagePlaintext={pagePlaintext}
          searchResults={searchResults}
        />
      </EntityFilesProvider>
      <SearchHintsModal />
      <CreateRelationshipModal mainDocument={mainDocument} />
    </EntityScopedProvider>
  );
};

export { Entity };
