/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';

import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Card } from 'app/V2/Components/UI';
import { getStats } from 'app/V2/api/settings';
import { formatBytes } from 'app/V2/shared/formatHelpers';

interface InstanceStats {
  users: { total: number; admin: number; editor: number; collaborator: number };
  entities: { total: number };
  files: { total: number };
  storage: { total: number };
}

const dashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    getStats(headers);

const Dashboard = () => {
  const stats = useLoaderData() as InstanceStats;
  const storage = formatBytes(stats.storage.total);
  const [storageValue, storageUnits] = storage.split(' ');

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Dashboard" />
        <SettingsContent.Body>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title={<Translate>Users</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-gray-900">{stats.users.total}</span>{' '}
                  <Translate className="text-lg font-medium text-gray-500">total users</Translate>
                </div>
                <div>
                  <span className="text-gray-700">{stats.users.admin}</span>{' '}
                  <Translate className="mr-4 text-gray-500">Admins</Translate>
                  <span className="mr-4 text-gray-200">|</span>
                  <span className="text-gray-700">{stats.users.editor}</span>{' '}
                  <Translate className="mr-4 text-gray-500">Editors</Translate>
                  <span className="mr-4 text-gray-200">|</span>
                  <span className="text-gray-700">{stats.users.collaborator}</span>{' '}
                  <Translate className="text-gray-500">Collaborators</Translate>
                </div>
              </div>
            </Card>
            <Card title={<Translate>Storage</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-gray-900">{storageValue}</span>{' '}
                  <Translate className="text-lg font-medium text-gray-500">
                    {storageUnits}
                  </Translate>
                </div>
                <Translate className="text-gray-500">Files and database usage</Translate>
              </div>
            </Card>
            <Card title={<Translate>Entities</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-gray-900">{stats.entities.total}</span>{' '}
                  <Translate className="text-lg font-medium text-gray-500">
                    total entities
                  </Translate>
                </div>
                <Translate className="text-gray-500">Entities across all languages</Translate>
              </div>
            </Card>
            <Card title={<Translate>Files</Translate>}>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-5xl font-black text-gray-900">{stats.files.total}</span>{' '}
                  <Translate className="text-lg font-medium text-gray-500">total files</Translate>
                </div>
                <Translate className="text-gray-500">
                  Total files from main documents, supporting files and uploads
                </Translate>
              </div>
            </Card>
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer></SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { Dashboard, dashboardLoader };
