/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useMemo } from 'react';
import { EntitySchema } from 'shared/types/entityType';
import { LoaderFunction, useLoaderData, useNavigate, useParams } from 'react-router';
import { PaneLayout } from 'app/V2/Components/Layouts/PaneLayout';
import { Tabs } from 'app/V2/Routes/Entity/Components/Tabs';
import {
  Bars3CenterLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  FunnelIcon,
  FlagIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { RelationshipPropertyIcon } from 'app/V2/Components/CustomIcons';

const entityLoader = (): LoaderFunction => async () => ({
  title: 'My entity',
});

const Entity = () => {
  const entity = useLoaderData() as EntitySchema;
  const navigate = useNavigate();
  const { sharedId, tabView } = useParams();

  const [mainFromPath, subFromPath] = (tabView || '').split('-');
  const mainTabFromUrl = mainFromPath || 'metadata';
  const subTabFromUrl = subFromPath || 'attachments';

  const buildPath = useCallback(
    (main: string, sub: string) => `/entityv2/${sharedId}/${main}-${sub}`,
    [sharedId]
  );

  const setMainTab = async (id: string) => {
    await navigate(buildPath(id, subTabFromUrl), { replace: true, relative: 'path' });
  };

  const setSubTab = async (id: string) => {
    await navigate(buildPath(mainTabFromUrl, id), { replace: true, relative: 'path' });
  };

  const mainTabs = useMemo(
    () => [
      {
        id: 'metadata',
        label: 'Metadata',
        controls: 'metadata',
        icon: <Bars3CenterLeftIcon className="w-5 h-5" />,
        content: (
          <div no-translate>
            <h1>{entity.title}</h1>
          </div>
        ),
      },
      {
        id: 'document',
        label: 'Document',
        controls: 'document',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        content: (
          <div>
            <h1>{entity.title}</h1>
          </div>
        ),
      },
      {
        id: 'relationships',
        label: 'Relationships',
        controls: 'relationships',
        icon: <RelationshipPropertyIcon className="w-5 h-5" />,
        count: 14,
        content: (
          <div>
            <h1>{entity.title}</h1>
          </div>
        ),
      },
      {
        id: 'files',
        label: 'Files',
        controls: 'files',
        icon: <FolderIcon className="w-5 h-5" />,
        content: (
          <div>
            <h1>{entity.title}</h1>
          </div>
        ),
        count: 3,
      },
    ],
    [entity.title]
  );

  const sideTabs = useMemo(() => {
    switch (mainTabFromUrl) {
      case 'document':
        return [
          {
            id: 'side-metadata',
            label: 'Metadata',
            controls: 'side-panel-metadata',
            content: <div />,
            icon: <Bars3CenterLeftIcon className="w-5 h-5" />,
          },
          {
            id: 'toc',
            label: 'Table of Contents',
            controls: 'side-panel-annotations',
            content: <div />,
            icon: <ListBulletIcon className="w-5 h-5" />,
          },
        ];
      case 'relationships':
        return [
          {
            id: 'filters',
            label: 'Filters',
            controls: 'side-panel-filter',
            content: <div />,
            icon: <FunnelIcon className="w-5 h-5" />,
          },
          {
            id: 'graphs',
            label: 'Suggestions',
            controls: 'side-panel-suggestions',
            content: <div />,
            icon: <ChartBarIcon className="w-5 h-5" />,
          },
        ];
      case 'files':
        return [
          {
            id: 'file',
            label: 'File',
            controls: 'side-panel-file',
            content: <div />,
            icon: <DocumentTextIcon className="w-5 h-5" />,
          },
          {
            id: 'translations',
            label: 'Translations',
            controls: 'side-panel-translations',
            content: <div />,
            icon: <FlagIcon className="w-5 h-5" />,
          },
        ];
      case 'metadata':
      default:
        return [
          {
            id: 'side-metadata',
            label: 'Metadata',
            controls: 'side-panel-metadata',
            content: <div />,
            icon: <Bars3CenterLeftIcon className="w-5 h-5" />,
          },
        ];
    }
  }, [mainTabFromUrl]);

  // ensure subtab in URL is valid for current sideTabs
  const ensuredSubTab = useMemo(() => {
    const exists = sideTabs.some(t => t.id === subTabFromUrl);
    if (exists) return subTabFromUrl;
    return sideTabs[0]?.id || '';
  }, [sideTabs, subTabFromUrl]);

  // keep URL normalized to /entity/:id/<main>-<sub>
  useEffect(() => {
    if (!sharedId) return;
    const desired = `${mainTabFromUrl}-${ensuredSubTab}`;
    if (tabView !== desired) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigate(buildPath(mainTabFromUrl, ensuredSubTab), { replace: true, relative: 'path' });
    }
  }, [sharedId, tabView, mainTabFromUrl, ensuredSubTab, navigate, buildPath]);

  return (
    <div className="tw-content">
      <PaneLayout defaultWidthsPercents={[0.65, 0.35]} className="bg-white">
        <PaneLayout.Pane className="py-6 px-4 h-full">
          <Tabs
            tabs={mainTabs}
            activeId={mainTabFromUrl}
            onTabSelected={async id => setMainTab(id)}
          />
        </PaneLayout.Pane>
        <PaneLayout.Pane className="py-6 px-4">
          <Tabs
            tabs={sideTabs}
            activeId={ensuredSubTab}
            onTabSelected={async id => setSubTab(id)}
          />
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  );
};

export { Entity, entityLoader };
