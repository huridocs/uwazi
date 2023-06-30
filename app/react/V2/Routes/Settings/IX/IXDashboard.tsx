import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as ixAPI from 'V2/api/ix';
import { IXExtractorInfo } from './types';

const IXDashboard = () => {
  const extractors = useLoaderData() as IXExtractorInfo;

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction dashboard" />

        <SettingsContent.Body>content</SettingsContent.Body>

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
