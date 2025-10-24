import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import { Bars3CenterLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { getEntityCompositionUseCase } from 'V2/application/container/singletons';
import { fullDetailOptions } from 'V2/application/optionsPresets';
import { PaneLayout } from 'V2/Components/Layouts/PaneLayout';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { PDF } from 'V2/Components/PDFViewer';
import { RelationshipPropertyIcon } from 'V2/Components/CustomIcons';
import { Tabs } from 'V2/Components/UI';
import { TabLabel } from './Components/TabLabel';

const MAIN_TABS = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
} as const;

const SIDE_TABS = {
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
} as const;

type MainTabId = (typeof MAIN_TABS)[keyof typeof MAIN_TABS];
type SideTabId = (typeof SIDE_TABS)[keyof typeof SIDE_TABS];

type LoaderResponse = EntityType | undefined;

const shouldRevalidate = ({
  currentParams,
  nextParams,
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean => {
  if (currentParams.sharedId !== nextParams.sharedId) {
    return true;
  }

  if (currentUrl?.pathname === nextUrl?.pathname && currentUrl?.search !== nextUrl?.search) {
    return false;
  }

  return defaultShouldRevalidate;
};

const entityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;

    if (!entitySharedId) {
      return undefined;
    }

    const entityCompositionUseCase = await getEntityCompositionUseCase();

    const composition = await entityCompositionUseCase.composeEntity(
      entitySharedId,
      fullDetailOptions,
      {
        headers,
      }
    );

    if (!composition.success || !composition.entity) {
      throw new Response(
        JSON.stringify({
          error: 'Failed to load entity',
          message: composition.error || 'Entity not found',
          entityId: entitySharedId,
        }),
        {
          status: 404,
          statusText: 'Entity Not Found',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return composition.entity;
  };

const Entity = () => {
  const entity = useLoaderData<LoaderResponse>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeMainTab, setActiveMainTab] = useState<MainTabId>(() => {
    const mainTab = searchParams.get('main');
    if (mainTab) {
      return mainTab as MainTabId;
    }
    if (entity?.documents?.length) {
      return MAIN_TABS.DOCUMENT;
    }
    return MAIN_TABS.METADATA;
  });

  const [activeSideTab, setActiveSideTab] = useState<SideTabId | undefined>(() => {
    const sideTab = searchParams.get('side');
    return sideTab ? (sideTab as SideTabId) : undefined;
  });

  const onMainTabChange = (selectedMainTab: string) => {
    setActiveMainTab(selectedMainTab as MainTabId);
    setActiveSideTab(undefined);
    const next = new URLSearchParams(searchParams.toString());
    next.set('main', selectedMainTab);
    next.delete('side');
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const onSideTabChange = (selectedSideTab: string) => {
    setActiveSideTab(selectedSideTab as SideTabId);
    const next = new URLSearchParams(searchParams.toString());
    next.set('side', selectedSideTab);
    if (!next.get('main')) {
      next.set('main', activeMainTab);
    }
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const sideTabsByMain: Record<
    MainTabId,
    { id: SideTabId; label: React.ReactNode; content: React.ReactNode }[]
  > = useMemo(
    () => ({
      [MAIN_TABS.DOCUMENT]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: entity ? <MetadataDisplay entity={entity} /> : <Translate>Loading</Translate>,
        },
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div no-translate>rels content</div>,
        },
      ],
      [MAIN_TABS.METADATA]: [
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div no-translate>rels content</div>,
        },
      ],
      [MAIN_TABS.RELATIONSHIPS]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: entity ? <MetadataDisplay entity={entity} /> : <Translate>Loading</Translate>,
        },
      ],
    }),
    [entity]
  );

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <div className="tw-content">
      <PaneLayout defaultWidthsPercents={[0.65, 0.35]} className="bg-white">
        <PaneLayout.Pane className="py-4 px-2 h-full">
          <Tabs
            className="min-w-fit overflow-x-auto"
            unmountTabs={false}
            initialTabId={activeMainTab}
            onTabSelected={onMainTabChange}
          >
            <Tabs.Tab
              id={MAIN_TABS.DOCUMENT}
              label={<TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />}
            >
              {entity?.documents?.[0].filename ? (
                <PDF fileUrl={`/api/files/${entity.documents[0].filename}`} />
              ) : (
                <Translate>Loading</Translate>
              )}
            </Tabs.Tab>
            <Tabs.Tab
              id={MAIN_TABS.METADATA}
              label={
                <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />
              }
            >
              <MetadataDisplay entity={entity} />
            </Tabs.Tab>
            <Tabs.Tab
              id={MAIN_TABS.RELATIONSHIPS}
              label={
                <TabLabel
                  text="Relationships"
                  icon={<RelationshipPropertyIcon className="w-5 h-5" />}
                />
              }
            >
              <span no-translate>Relationships</span>
            </Tabs.Tab>
          </Tabs>
        </PaneLayout.Pane>
        <PaneLayout.Pane className="py-4 px-2 h-full">
          <Tabs
            className="min-w-[300px] overflow-x-auto"
            key={activeMainTab}
            unmountTabs={false}
            initialTabId={
              (activeSideTab && sideTabsByMain[activeMainTab].some(t => t.id === activeSideTab)
                ? activeSideTab
                : sideTabsByMain[activeMainTab][0].id) as string
            }
            onTabSelected={onSideTabChange}
          >
            {sideTabsByMain[activeMainTab].map(tab => (
              <Tabs.Tab id={tab.id} key={tab.id} label={tab.label}>
                {tab.content}
              </Tabs.Tab>
            ))}
          </Tabs>
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  );
};

export { Entity, entityLoader, shouldRevalidate };
