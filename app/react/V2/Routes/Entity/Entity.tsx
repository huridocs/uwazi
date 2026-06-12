import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import {
  SearchHintsModal,
  MAIN_TAB_PARAM,
  SIDE_TAB_PARAM,
  EntityFilesProvider,
  EntityMainPaneHeader,
  FilesDeleteConfirmationModal,
  AddFileModal,
  useEntityFiles,
} from './Components/index.js';
import {
  TabsMainButtons,
  MainTabsContent,
  MainTabsFooters,
  SideTabsPanel,
  MAIN_TAB,
  SIDE_TAB,
  isValidMainTab,
  isValidSideTab,
  type MainTabId,
  type SideTabId,
} from './Tabs/index.js';
import { getSideTabButtons } from './Tabs/sideTabSets.js';
import { LoaderResponse } from './types.js';

type EntityViewProps = {
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  searchResults?: SnippetsSearchResponse;
};

const EntityView = ({ entity, mainDocument, pagePlaintext, searchResults }: EntityViewProps) => {
  const { focusedRow, primaryRows } = useEntityFiles();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchResults = useRef(searchResults);

  const hasMainDocument = Boolean(mainDocument?.filename);
  const filesCount = (entity.documents?.length || 0) + (entity.attachments?.length || 0);

  const mainTabIds = useMemo(() => {
    const ids = new Set<MainTabId>([MAIN_TAB.METADATA, MAIN_TAB.RELATIONSHIPS]);
    if (hasMainDocument) ids.add(MAIN_TAB.DOCUMENT);
    if (filesCount > 0) ids.add(MAIN_TAB.FILES);
    return ids;
  }, [hasMainDocument, filesCount]);

  const filesSideTabs = useMemo(
    () => ({
      showTranslationsTab: focusedRow?.category === 'primary',
      translationsCount: primaryRows.length,
    }),
    [focusedRow?.category, primaryRows.length]
  );

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) {
      return mainTab;
    }
    if (hasMainDocument) {
      return MAIN_TAB.DOCUMENT;
    }
    return MAIN_TAB.METADATA;
  }, [searchParams, hasMainDocument, mainTabIds]);

  const sideTabButtons = useMemo(
    () =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument,
        filesSideTabs,
      }),
    [activeMainTab, entity, hasMainDocument, filesSideTabs]
  );

  const activeSideTab = useMemo<SideTabId | undefined>(() => {
    const sideTab = searchParams.get(SIDE_TAB_PARAM);

    if (isValidSideTab(sideTab)) {
      return sideTab;
    }

    if (initialSearchResults.current) {
      return SIDE_TAB.SEARCH;
    }

    const firstId = sideTabButtons[0]?.id;
    if (firstId && isValidSideTab(firstId)) {
      return firstId;
    }
    return undefined;
  }, [searchParams, sideTabButtons]);

  useEffect(() => {
    const raw = searchParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    if (sideTabButtons.some(button => button.id === raw)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SIDE_TAB_PARAM);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, activeMainTab, sideTabButtons, setSearchParams]);

  useEffect(() => {
    const raw = searchParams.get(MAIN_TAB_PARAM);
    if (!raw || !isValidMainTab(raw)) return;
    if (mainTabIds.has(raw)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(MAIN_TAB_PARAM);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, mainTabIds, setSearchParams]);

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (!isValidMainTab(selectedMainTab)) return;

      const next = new URLSearchParams(searchParams.toString());
      if (selectedMainTab !== activeMainTab) {
        const nextSideButtons = getSideTabButtons({
          activeMainTab: selectedMainTab,
          entity,
          hasMainDocument,
          filesSideTabs,
        });
        const rawS = next.get(SIDE_TAB_PARAM);
        const sStillValid =
          Boolean(rawS) &&
          isValidSideTab(rawS) &&
          nextSideButtons.some(button => button.id === rawS);
        if (!sStillValid) {
          next.delete(SIDE_TAB_PARAM);
        }
      }
      next.set(MAIN_TAB_PARAM, selectedMainTab);

      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [activeMainTab, searchParams, setSearchParams, entity, hasMainDocument, filesSideTabs]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (!isValidSideTab(selectedSideTab)) return;

      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, selectedSideTab);
      if (!next.get(MAIN_TAB_PARAM)) {
        next.set(MAIN_TAB_PARAM, activeMainTab);
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [activeMainTab, searchParams, setSearchParams]
  );

  return (
    <>
      <FilesDeleteConfirmationModal />
      <AddFileModal />
      <PaneLayout defaultRatios={[0.62, 0.38]} className="bg-parchment text-ink">
        <PaneLayout.Pane>
          <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
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
    <>
      <EntityFilesProvider entity={entity}>
        <EntityView
          entity={entity}
          mainDocument={mainDocument}
          pagePlaintext={pagePlaintext}
          searchResults={searchResults}
        />
      </EntityFilesProvider>

      <SearchHintsModal />
    </>
  );
};

export { Entity };
