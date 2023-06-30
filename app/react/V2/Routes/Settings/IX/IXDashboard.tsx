import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as ixAPI from 'V2/api/ix';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { IXExtractorInfo } from './types';
import { tableColumns } from './components/TableElements';

const IXDashboard = () => {
  const extractors = useLoaderData() as IXExtractorInfo[];

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction dashboard" />

        <SettingsContent.Body>
          <Table<IXExtractorInfo>
            data={extractors}
            columns={tableColumns}
            title={<Translate>Extractors</Translate>}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer>footer</SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

const dashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await ixAPI.getExtractors(headers);
    return extractors;
  };

export { IXDashboard, dashboardLoader };
