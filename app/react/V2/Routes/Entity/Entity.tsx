/* eslint-disable max-lines */
import React, { useCallback, useMemo } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import { Bars3CenterLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { getPagePlaintext } from 'V2/api/files';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { getEntityCompositionUseCase } from 'V2/application/container/singletons';
import { fullDetailOptions } from 'V2/application/optionsPresets';
import { PaneLayout } from 'V2/Components/Layouts/PaneLayout';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { RelationshipPropertyIcon } from 'V2/Components/CustomIcons';
import { Tabs } from 'V2/Components/UI';
import { TabLabel, PDFView } from './Components';

const MAIN_TAB_PARAM = 'm';
const SIDE_TAB_PARAM = 's';

const MAIN_TABS = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
};

const SIDE_TABS = {
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
};

type MainTabId = (typeof MAIN_TABS)[keyof typeof MAIN_TABS];
type SideTabId = (typeof SIDE_TABS)[keyof typeof SIDE_TABS];

const MAIN_TAB_VALUES = new Set(Object.values(MAIN_TABS));
const SIDE_TAB_VALUES = new Set(Object.values(SIDE_TABS));

const isValidMainTab = (value: string | null): value is MainTabId =>
  typeof value === 'string' && MAIN_TAB_VALUES.has(value);

const isValidSideTab = (value: string | null): value is SideTabId =>
  typeof value === 'string' && SIDE_TAB_VALUES.has(value);

type LoaderResponse = { entity: EntityType; pagePlaintext: string } | undefined;

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

  if (currentUrl.search === nextUrl.search) {
    return defaultShouldRevalidate;
  }

  return false;
};

const entityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params, request }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;
    const { searchParams } = new URL(request.url);
    const currentPage = searchParams.get('page') || '1';
    let pagePlaintext = '';

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

    if (composition.entity.mainDocument) {
      const response = await getPagePlaintext(
        composition.entity.mainDocument?._id as string,
        Number.parseInt(currentPage, 10)
      );

      if (response instanceof FetchResponseError) {
        throw new Response(
          JSON.stringify({
            error: 'Failed to load plaintext',
            message: response.message,
            entityId: entitySharedId,
          }),
          {
            status: 404,
            statusText: 'Failed to load plaintext',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        pagePlaintext = response;
      }
    }
    return { entity: composition.entity, pagePlaintext };
  };

const Entity = () => {
  const { entity, pagePlaintext } = useLoaderData<LoaderResponse>() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  const activeMainTab = useMemo<MainTabId>(() => {
    const mainTab = searchParams.get(MAIN_TAB_PARAM);
    if (isValidMainTab(mainTab)) {
      return mainTab;
    }
    if (entity?.mainDocument?.filename) {
      return MAIN_TABS.DOCUMENT;
    }
    return MAIN_TABS.METADATA;
  }, [searchParams, entity]);

  const activeSideTab = useMemo<SideTabId | undefined>(() => {
    const sideTab = searchParams.get(SIDE_TAB_PARAM);
    return isValidSideTab(sideTab) ? sideTab : undefined;
  }, [searchParams]);

  const mainTabElements = useMemo(() => {
    const tabs: React.ReactElement[] = [];

    if (entity?.mainDocument?.filename) {
      tabs.push(
        <Tabs.Tab
          id={MAIN_TABS.DOCUMENT}
          key={MAIN_TABS.DOCUMENT}
          label={<TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />}
        >
          <PDFView entity={entity} pagePlaintext={pagePlaintext} />
        </Tabs.Tab>
      );
    }

    tabs.push(
      <Tabs.Tab
        id={MAIN_TABS.METADATA}
        key={MAIN_TABS.METADATA}
        label={<TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />}
      >
        <MetadataDisplay entity={entity as any} />
      </Tabs.Tab>
    );

    tabs.push(
      <Tabs.Tab
        id={MAIN_TABS.RELATIONSHIPS}
        key={MAIN_TABS.RELATIONSHIPS}
        label={
          <TabLabel text="Relationships" icon={<RelationshipPropertyIcon className="w-5 h-5" />} />
        }
      >
        <span no-translate>Relationships</span>
      </Tabs.Tab>
    );

    return tabs;
  }, [entity, pagePlaintext]);

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
          content: <div no-translate>This content is not yet available</div>,
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
          content: <div no-translate>This content is not yet available</div>,
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

  const onMainTabChange = useCallback(
    (selectedMainTab: string) => {
      if (selectedMainTab !== activeMainTab) {
        const next = new URLSearchParams(searchParams.toString());
        next.set(MAIN_TAB_PARAM, selectedMainTab);
        next.delete(SIDE_TAB_PARAM);
        setSearchParams(next, { replace: true, preventScrollReset: true });
      }
    },
    [activeMainTab, searchParams, setSearchParams]
  );

  const onSideTabChange = useCallback(
    (selectedSideTab: string) => {
      if (selectedSideTab !== activeSideTab) {
        const next = new URLSearchParams(searchParams.toString());
        next.set(SIDE_TAB_PARAM, selectedSideTab);
        if (!next.get(MAIN_TAB_PARAM)) {
          next.set(MAIN_TAB_PARAM, activeMainTab);
        }
        setSearchParams(next, { replace: true, preventScrollReset: true });
      }
    },
    [activeMainTab, activeSideTab, searchParams, setSearchParams]
  );

  if (!entity) {
    return <Translate>Loading</Translate>;
  }

  return (
    <div className="tw-content">
      <PaneLayout defaultWidthsPercents={[0.65, 0.35]} className="bg-white">
        <PaneLayout.Pane className="p-2 h-full">
          <Tabs
            className=""
            unmountTabs={false}
            initialTabId={activeMainTab}
            onTabSelected={onMainTabChange}
          >
            {mainTabElements}
          </Tabs>
        </PaneLayout.Pane>
        <PaneLayout.Pane className="p-2 h-full">
          <Tabs
            className="min-w-[300px] overflow-x-auto"
            key={activeMainTab}
            unmountTabs={false}
            initialTabId={activeSideTab || sideTabsByMain[activeMainTab]?.[0]?.id}
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
