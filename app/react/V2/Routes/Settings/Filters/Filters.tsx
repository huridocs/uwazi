import React from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import * as settingsAPI from 'V2/api/settings';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';

type LoaderData = ClientSettingsFilterSchema[] | undefined;

const filtersLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderData> =>
  async () => {
    const { filters } = await settingsAPI.get(headers);
    return filters;
  };

const Filters = () => {
  const filters = useLoaderData() as LoaderData;

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Filters" />

        <SettingsContent.Body></SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2 justify-end items-center"></SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { Filters, filtersLoader };
