import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
  useParams,
} from 'react-router';
import { Bars3CenterLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { PaneLayout } from 'V2/Components/Layouts/PaneLayout';
import { getEntityCompositionUseCase } from 'V2/application/container/singletons';
import { fullDetailOptions } from 'V2/application/optionsPresets';
import { RelationshipPropertyIcon } from 'V2/Components/CustomIcons';
import { Tabs } from 'V2/Components/UI';
import { TabLabel } from './Components/TabLabel';

const MAIN_TABS = {
  DOCUMENT: 'pdf',
  MAIN_METADATA: 'main-metadata',
  RELATIONSHIPS: 'main-rels',
} as const;

const SIDE_TABS = {
  METADATA: 'side-metadata',
  RELATIONSHIPS: 'side-rels',
} as const;

type MainTabId = (typeof MAIN_TABS)[keyof typeof MAIN_TABS];
type SideTabId = (typeof SIDE_TABS)[keyof typeof SIDE_TABS];

type LoaderResponse = EntityType | undefined;

const shouldRevalidate = ({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean => {
  if (defaultShouldRevalidate || currentParams.sharedId !== nextParams.sharedId) {
    return true;
  }

  return false;
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
  const { tabView } = useParams();
  const [activeMainTab, setActiveMainTab] = useState<MainTabId>(
    (tabView as MainTabId) || MAIN_TABS.DOCUMENT
  );
  const [activeSideTab, setActiveSideTab] = useState<SideTabId | undefined>(undefined);

  const sideTabsByMain: Record<
    MainTabId,
    { id: SideTabId; label: React.ReactNode; content: React.ReactNode }[]
  > = useMemo(
    () => ({
      [MAIN_TABS.DOCUMENT]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: <div>Sidepanel Metadata</div>,
        },
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div>rels content</div>,
        },
      ],
      [MAIN_TABS.MAIN_METADATA]: [
        {
          id: SIDE_TABS.RELATIONSHIPS,
          label: (
            <TabLabel
              text="Relationships"
              icon={<RelationshipPropertyIcon className="w-5 h-5" />}
            />
          ),
          content: <div>rels content</div>,
        },
      ],
      [MAIN_TABS.RELATIONSHIPS]: [
        {
          id: SIDE_TABS.METADATA,
          label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
          content: <div>Sidepanel Metadata</div>,
        },
      ],
    }),
    []
  );

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <div className="tw-content">
      <PaneLayout defaultWidthsPercents={[0.65, 0.35]} className="bg-white">
        <PaneLayout.Pane className="py-4 px-2 h-full">
          <Tabs
            unmountTabs={false}
            initialTabId={activeMainTab}
            onTabSelected={(selectedTab: string) => {
              setActiveMainTab(selectedTab as MainTabId);
              setActiveSideTab(undefined);
            }}
          >
            <Tabs.Tab
              id={MAIN_TABS.DOCUMENT}
              label={<TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />}
            >
              Document
            </Tabs.Tab>
            <Tabs.Tab
              id={MAIN_TABS.MAIN_METADATA}
              label={
                <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />
              }
            >
              Metadata
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
              Relationships
            </Tabs.Tab>
          </Tabs>
        </PaneLayout.Pane>
        <PaneLayout.Pane className="py-4 px-2 h-full">
          <Tabs
            key={activeMainTab}
            unmountTabs={false}
            initialTabId={
              (activeSideTab && sideTabsByMain[activeMainTab].some(t => t.id === activeSideTab)
                ? activeSideTab
                : sideTabsByMain[activeMainTab][0].id) as string
            }
            onTabSelected={selectedTab => setActiveSideTab(selectedTab as SideTabId)}
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
