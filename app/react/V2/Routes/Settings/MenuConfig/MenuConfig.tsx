/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import * as SettingsAPI from 'app/V2/api/settings';
import { UserSchema } from 'shared/types/userType';

import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';

import { Button, Table, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { Settings } from 'shared/types/settingsType';
import { LinkSchema } from 'shared/types/commonTypes';

import {
  EditButton,
  TitleHeader,
  URLHeader,
  ActionHeader,
  TitleCell,
} from './components/TableComponents';

const menuConfigloader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    SettingsAPI.get(headers);

const MenuConfig = () => {
  const settings = useLoaderData() as Settings;
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  //const setNotifications = useSetRecoilState(notificationAtom);
  //const revalidator = useRevalidator();

  const edit = (row: Row<LinkSchema>) => {};

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor('title', {
      id: 'title',
      header: TitleHeader,
      cell: TitleCell,
      enableSorting: false,
      meta: { className: 'w-6/12' },
    }) as ColumnDef<LinkSchema, 'title'>,
    columnHelper.accessor('url', {
      header: URLHeader,
      enableSorting: false,
      meta: { className: 'w-6/12' },
    }) as ColumnDef<LinkSchema, 'default'>,
    columnHelper.accessor('key', {
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: { action: edit, className: 'w-0 text-center' },
    }) as ColumnDef<LinkSchema, 'key'>,
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Menu" />
        <SettingsContent.Body>
          <Table<LinkSchema>
            enableSelection
            columns={columns}
            data={settings?.links || []}
            title={<Translate>Menu</Translate>}
            subRowsKey="sublinks"
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2">
            <Button type="button">
              <Translate>Add link</Translate>
            </Button>
            <Button type="button">
              <Translate>Add group</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={<Translate className="uppercase">Two-Factor Authentication</Translate>}
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="large"
        withOverlay
      >
        Sidepanel
      </Sidepanel>
    </div>
  );
};

export { MenuConfig, menuConfigloader };
