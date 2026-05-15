/* eslint-disable max-lines */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import {
  Bars3CenterLeftIcon,
  DocumentTextIcon,
  LinkIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { RelationshipPropertyIcon } from '#V2/Components/CustomIcons/index.js';
import { Tabs } from '#V2/Components/UI/index.js';
import {
  TabLabel,
  PDFView,
  ReferencesPanel,
  SearchHintsModal,
  MAIN_TAB_PARAM,
  SIDE_TAB_PARAM,
  SearchResults,
  ToCPanel,
  FileList,
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
};

type MainTabId = (typeof MAIN_TABS)[keyof typeof MAIN_TABS];
type SideTabId = (typeof SIDE_TABS)[keyof typeof SIDE_TABS];

const MAIN_TAB_VALUES = new Set(Object.values(MAIN_TABS));
const SIDE_TAB_VALUES = new Set(Object.values(SIDE_TABS));

const isValidMainTab = (value: string | null): value is MainTabId =>
  typeof value === 'string' && MAIN_TAB_VALUES.has(value);

const isValidSideTab = (value: string | null): value is SideTabId =>
  typeof value === 'string' && SIDE_TAB_VALUES.has(value);

const Entity = () => {
  const { entity, mainDocument, pagePlaintext, searchResults } =
    useLoaderData<LoaderResponse>() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchResults = useRef(searchResults);

  const mainTabElements = useMemo(() => {
    const tabs: React.ReactElement[] = [];

    if (entity && mainDocument?.filename) {
      tabs.push(
        <Tabs.Tab
          id={MAIN_TABS.DOCUMENT}
          key={MAIN_TABS.DOCUMENT}
          label={<TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />}
        >
          <PDFView
            mainDocument={mainDocument}
            templateId={entity.template}
            pagePlaintext={pagePlaintext}
            entityTitle={entity.title}
            entityIconId={entity.icon?._id}
          />
        </Tabs.Tab>
      );
    }

    if (entity) {
      tabs.push(
        <Tabs.Tab
          id={MAIN_TABS.METADATA}
          key={MAIN_TABS.METADATA}
          label={<TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />}
        >
          <MetadataDisplay entity={entity} />
        </Tabs.Tab>
      );
    }

    tabs.push(
      <Tabs.Tab
        id={MAIN_TABS.RELATIONSHIPS}
        key={MAIN_TABS.RELATIONSHIPS}
        label={
          <TabLabel text="Relationships" icon={<RelationshipPropertyIcon className="w-5 h-5" />} />
        }
      >
        <span no-translate="true">Relationships</span>
      </Tabs.Tab>
    );
    if (entity?.documents?.length || entity?.attachments?.length) {
      tabs.push(
        <Tabs.Tab
          id={MAIN_TABS.FILES}
          key={MAIN_TABS.FILES}
          label={<TabLabel text="Files" icon={<PaperClipIcon className="w-5 h-5" />} />}
        >
          <FileList entity={entity} />
        </Tabs.Tab>
      );
    }

    return tabs;
  }, [entity, mainDocument, pagePlaintext]);

  const mainTabIds = useMemo(
    () => new Set(mainTabElements.map(tab => tab.props.id as MainTabId)),
    [mainTabElements]
  );

  const sideTabsByMain: Record<
    MainTabId,
    { id: SideTabId; label: React.ReactNode; content: React.ReactNode }[]
  > = useMemo(
    () => ({
      [MAIN_TABS.DOCUMENT]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: entity ? (
            <MetadataDisplay entity={entity} headerLayout="stacked" />
          ) : (
            <Translate>Loading</Translate>
          ),
        },
        {
          id: SIDE_TABS.TOC,
          label: <TabLabel text="ToC" icon={<ListBulletIcon className="w-5 h-5" />} />,
          content: (
            <ToCPanel
              toc={mainDocument?.toc}
              generatedToc={mainDocument?.generatedToc}
              file={mainDocument}
            />
          ),
        },
        {
          id: SIDE_TABS.REFERENCES,
          label: <TabLabel text="References" icon={<LinkIcon className="w-5 h-5" />} />,
          content: <ReferencesPanel entity={entity} mainDocument={mainDocument} />,
        },
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div no-translate="true">This content is not yet available</div>,
        },
        {
          id: SIDE_TABS.SEARCH,
          label: <TabLabel text="Search" icon={<MagnifyingGlassIcon className="w-5 h-5" />} />,
          content: <SearchResults />,
        },
      ],
      [MAIN_TABS.METADATA]: [
        ...(entity && mainDocument?.filename
          ? [
              {
                id: SIDE_TABS.DOCUMENT,
                label: <TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />,
                content: (
                  <PDFView
                    mainDocument={mainDocument}
                    templateId={entity.template}
                    pagePlaintext={pagePlaintext}
                    entityTitle={entity.title}
                    entityIconId={entity.icon?._id}
                    showEntityHeader={false}
                  />
                ),
              },
            ]
          : []),
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div no-translate="true">This content is not yet available</div>,
        },
        {
          id: SIDE_TABS.SEARCH,
          label: <TabLabel text="Search" icon={<MagnifyingGlassIcon className="w-5 h-5" />} />,
          content: <SearchResults />,
        },
      ],
      [MAIN_TABS.RELATIONSHIPS]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: entity ? (
            <MetadataDisplay entity={entity} headerLayout="stacked" />
          ) : (
            <Translate>Loading</Translate>
          ),
        },
      ],
      [MAIN_TABS.FILES]: [],
    }),
    [entity, mainDocument, pagePlaintext]
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

  const activeSideTab = useMemo<SideTabId | undefined>(() => {
    const availableTabs = sideTabsByMain[activeMainTab] || [];
    const sideTab = searchParams.get(SIDE_TAB_PARAM);

    if (isValidSideTab(sideTab) && availableTabs.some(tab => tab.id === sideTab)) {
      return sideTab;
    }

    if (initialSearchResults.current) {
      return SIDE_TABS.SEARCH;
    }

    return availableTabs[0]?.id;
  }, [searchParams, activeMainTab, sideTabsByMain]);

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

  const sideTabElements = useMemo(
    () =>
      sideTabsByMain[activeMainTab]?.map(tab => (
        <Tabs.Tab id={tab.id} key={tab.id} label={tab.label}>
          {tab.content}
        </Tabs.Tab>
      )),
    [sideTabsByMain, activeMainTab]
  );

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

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <>
      <PaneLayout defaultRatios={[0.62, 0.38]} className="bg-(--color-theme-surface-page) text-ink">
        <PaneLayout.Pane>
          <Tabs
            unmountTabs={false}
            domIdPrefix="entity-main"
            initialTabId={activeMainTab}
            onTabSelected={onMainTabChange}
            tabListAriaLabel="Entity primary"
          >
            {mainTabElements}
          </Tabs>
        </PaneLayout.Pane>
        <PaneLayout.Pane>
          <Tabs
            key={activeMainTab}
            className="min-w-0 w-full border-l border-[color-mix(in_srgb,var(--color-theme-border-default)_65%,transparent)]"
            unmountTabs={false}
            domIdPrefix="entity-side"
            initialTabId={activeSideTab}
            onTabSelected={onSideTabChange}
            tabListAriaLabel="Side panel tabs"
          >
            {sideTabElements}
          </Tabs>
        </PaneLayout.Pane>
      </PaneLayout>

      <SearchHintsModal />
    </>
  );
};

export { Entity };
