/* eslint-disable max-lines */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { TabButtons, TabPanels, splitTabConfig } from '#V2/Components/UI/index.js';
import { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import {
  SearchHintsModal,
  MAIN_TAB_PARAM,
  SIDE_TAB_PARAM,
  buildMainTabs,
  buildSecondaryTabsByMain,
  EntityFilesProvider,
  EntityMainPaneHeader,
  FilesDeleteConfirmationModal,
  useEntityFiles,
} from './Components/index.js';
import { LoaderResponse } from './types.js';

const MAIN_TABS = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
  FILES: 'files',
};

const SIDE_TABS = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  TOC: 'toc',
  REFERENCES: 'references',
  RELATIONSHIPS: 'relationships',
  SEARCH: 'search',
  FILE: 'file',
  TRANSLATIONS: 'translations',
};

type MainTabId = (typeof MAIN_TABS)[keyof typeof MAIN_TABS];
type SideTabId = (typeof SIDE_TABS)[keyof typeof SIDE_TABS];

const MAIN_TAB_VALUES = new Set(Object.values(MAIN_TABS));
const SIDE_TAB_VALUES = new Set(Object.values(SIDE_TABS));

const isValidMainTab = (value: string | null): value is MainTabId =>
  typeof value === 'string' && MAIN_TAB_VALUES.has(value);

const isValidSideTab = (value: string | null): value is SideTabId =>
  typeof value === 'string' && SIDE_TAB_VALUES.has(value);

type EntityViewProps = {
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  searchResults?: LoaderResponse['searchResults'];
};

const EntityView = ({ entity, mainDocument, pagePlaintext, searchResults }: EntityViewProps) => {
  const { focusedRow, primaryRows } = useEntityFiles();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchResults = useRef(searchResults);

  const mainTabConfigs = useMemo(
    () => buildMainTabs({ entity, mainDocument, pagePlaintext, mainTabs: MAIN_TABS }),
    [entity, mainDocument, pagePlaintext]
  );

  const { buttons: mainTabButtons, panels: mainTabPanels } = useMemo(
    () => splitTabConfig(mainTabConfigs),
    [mainTabConfigs]
  );

  const mainTabIds = useMemo(
    () => new Set(mainTabConfigs.map(tab => tab.id as MainTabId)),
    [mainTabConfigs]
  );

  const sideTabsByMain = useMemo(
    () =>
      buildSecondaryTabsByMain({
        entity,
        mainDocument,
        pagePlaintext,
        mainTabs: MAIN_TABS,
        sideTabs: SIDE_TABS,
        filesSideTabs: {
          showTranslationsTab: focusedRow?.category === 'primary',
          translationsCount: primaryRows.length,
        },
      }),
    [entity, focusedRow?.category, mainDocument, pagePlaintext, primaryRows.length]
  );

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab) && mainTabIds.has(mainTab)) {
      return mainTab;
    }
    if (mainDocument?.filename) {
      return MAIN_TABS.DOCUMENT;
    }
    return MAIN_TABS.METADATA;
  }, [searchParams, mainDocument, mainTabIds]);

  const currentSideTabConfigs = useMemo(
    () => sideTabsByMain[activeMainTab] ?? [],
    [sideTabsByMain, activeMainTab]
  );

  const { buttons: sideTabButtons, panels: sideTabPanels } = useMemo(
    () => splitTabConfig(currentSideTabConfigs),
    [currentSideTabConfigs]
  );

  const activeSideTab = useMemo<SideTabId | undefined>(() => {
    const availableTabs = currentSideTabConfigs;
    const sideTab = searchParams.get(SIDE_TAB_PARAM);

    if (isValidSideTab(sideTab) && availableTabs.some(tab => tab.id === sideTab)) {
      return sideTab;
    }

    if (initialSearchResults.current) {
      return SIDE_TABS.SEARCH;
    }

    return availableTabs[0]?.id;
  }, [searchParams, currentSideTabConfigs]);

  useEffect(() => {
    const raw = searchParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    const available = sideTabsByMain[activeMainTab] ?? [];
    if (available.some(tab => tab.id === raw)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SIDE_TAB_PARAM);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [searchParams, activeMainTab, sideTabsByMain, setSearchParams]);

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
        const nextAvailable = sideTabsByMain[selectedMainTab] ?? [];
        const rawS = next.get(SIDE_TAB_PARAM);
        const sStillValid =
          Boolean(rawS) && isValidSideTab(rawS) && nextAvailable.some(t => t.id === rawS);
        if (!sStillValid) {
          next.delete(SIDE_TAB_PARAM);
        }
      }
      next.set(MAIN_TAB_PARAM, selectedMainTab);

      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [activeMainTab, searchParams, setSearchParams, sideTabsByMain]
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
      <PaneLayout defaultRatios={[0.62, 0.38]} className="bg-parchment text-ink">
        <PaneLayout.Pane>
          <div className="flex min-h-0 min-w-0 w-full flex-col h-full">
            <div className="flex flex-col gap-3 px-3 py-2.5 border-b border-border-soft">
              <TabButtons
                groupId="entity-main"
                buttons={mainTabButtons}
                activeTabId={activeMainTab}
                onTabChange={onMainTabChange}
                tabListAriaLabel="Entity primary"
              />
              <EntityMainPaneHeader
                entity={entity}
                showDocumentViewMode={
                  activeMainTab === MAIN_TABS.DOCUMENT && Boolean(mainDocument?.filename)
                }
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 grow">
              <TabPanels
                groupId="entity-main"
                panels={mainTabPanels}
                unmountInactive={false}
                className=" overflow-y-auto"
              />
            </div>
          </div>
        </PaneLayout.Pane>
        <PaneLayout.Pane key={activeMainTab}>
          <div className="flex px-3 py-2.5 gap-3 min-h-0 min-w-0 w-full flex-col h-full border-l border-border-soft">
            <TabButtons
              groupId="entity-side"
              buttons={sideTabButtons}
              activeTabId={activeSideTab}
              onTabChange={onSideTabChange}
              tabListAriaLabel="Side panel tabs"
            />
            <TabPanels
              groupId="entity-side"
              panels={sideTabPanels}
              unmountInactive={false}
              className="grow overflow-y-auto"
            />
          </div>
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
