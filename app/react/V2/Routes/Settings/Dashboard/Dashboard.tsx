/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Card } from '#V2/Components/UI/index.js';
import { getStats } from '#V2/api/settings/index.js';
import { formatBytes } from '#V2/shared/formatHelpers.js';
import { CollectionStats } from '#V2/api/settings/types.js';

const dashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [stats] = await getStats(headers);

    return stats;
  };

const Dashboard = () => {
  const stats = useLoaderData() as CollectionStats | undefined;
  const storage = formatBytes(stats?.storage.total || 0);
  const [storageValue, storageUnits] = storage.split(' ');

  return (
    <div className="w-full h-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header title="Dashboard" />
        <SettingsContent.Body>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title={<Translate>Users</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-ink">{stats?.users.total}</span>{' '}
                  <Translate className="text-lg font-medium text-ink-muted">total users</Translate>
                </div>
                <div>
                  <span className="text-ink">{stats?.users.admin}</span>{' '}
                  <Translate className="mr-4 text-ink-muted">Admins</Translate>
                  <span className="mr-4 text-ink-muted">|</span>
                  <span className="text-ink">{stats?.users.editor}</span>{' '}
                  <Translate className="mr-4 text-ink-muted">Editors</Translate>
                  <span className="mr-4 text-ink-muted">|</span>
                  <span className="text-ink">{stats?.users.collaborator}</span>{' '}
                  <Translate className="text-ink-muted">Collaborators</Translate>
                </div>
              </div>
            </Card>
            <Card title={<Translate>Storage</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-ink">{storageValue}</span>{' '}
                  <Translate className="text-lg font-medium text-ink-muted">
                    {storageUnits}
                  </Translate>
                </div>
                <Translate className="text-ink-muted">Files and database usage</Translate>
              </div>
            </Card>
            <Card title={<Translate>Entities</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-ink">{stats?.entities.total}</span>{' '}
                  <Translate className="text-lg font-medium text-ink-muted">
                    total entities
                  </Translate>
                </div>
                <Translate className="text-ink-muted">Entities across all languages</Translate>
              </div>
            </Card>
            <Card title={<Translate>Files</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-ink">{stats?.files.total}</span>{' '}
                  <Translate className="text-lg font-medium text-ink-muted">total files</Translate>
                </div>
                <Translate className="text-ink-muted">
                  Total files from main documents, supporting files and uploads
                </Translate>
              </div>
            </Card>
          </div>
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { Dashboard, dashboardLoader };
