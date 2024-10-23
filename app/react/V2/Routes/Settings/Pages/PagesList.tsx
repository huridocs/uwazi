/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { Link, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import * as pagesAPI from 'V2/api/pages';
import { Button, ConfirmationModal, Table } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Page } from 'app/V2/shared/types';
import { notificationAtom, notificationAtomType } from 'app/V2/atoms';
import { FetchResponseError } from 'shared/JSONRequest';
import {
  EntityViewHeader,
  YesNoPill,
  TitleHeader,
  UrlHeader,
  ActionCell,
  UrlCell,
  ActionHeader,
  List,
} from './components/PageListTable';

type TablePage = Page & { rowId: string };

const pagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    (await pagesAPI.get(headers)).map(page => ({ ...page, rowId: page._id }));

const deletionNotification: (hasErrors: boolean) => notificationAtomType = hasErrors => ({
  type: !hasErrors ? 'success' : 'error',
  text: !hasErrors ? (
    <Translate>Deleted successfully.</Translate>
  ) : (
    <Translate>An error occurred</Translate>
  ),
});

const columnHelper = createColumnHelper<TablePage>();

const PagesList = () => {
  const [selectedPages, setSelectedPages] = useState<TablePage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const pages = useLoaderData() as TablePage[];
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

  const deleteSelected = async () => {
    setShowModal(false);
    const sharedIds = selectedPages.map(row => row.sharedId);
    const result = await Promise.all(
      sharedIds.map(async sharedId => pagesAPI.deleteBySharedId(sharedId!))
    );
    const hasErrors = result.find(res => res instanceof FetchResponseError) !== undefined;
    setNotifications(deletionNotification(hasErrors));
    revalidator.revalidate();
  };

  const columns = [
    columnHelper.accessor('title', {
      header: TitleHeader,
      meta: { headerClassName: 'w-2/6' },
    }),
    columnHelper.accessor('sharedId', {
      header: UrlHeader,
      cell: UrlCell,
      meta: { headerClassName: 'w-2/6' },
    }),
    columnHelper.accessor('entityView', {
      header: EntityViewHeader,
      cell: YesNoPill,
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.accessor('sharedId', {
      id: 'action',
      header: ActionHeader,
      cell: ActionCell,
      enableSorting: false,
    }),
  ];

  const confirmDeletion = () => {
    setShowModal(true);
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-pages"
    >
      <SettingsContent>
        <SettingsContent.Header title="Pages" />
        <SettingsContent.Body>
          <Table
            columns={columns}
            data={pages}
            enableSelections
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Pages
              </Translate>
            }
            onChange={({ selectedRows }) => {
              setSelectedPages(pages.filter(page => page.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'title', desc: false }]}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedPages.length ? 'bg-primary-50' : ''}>
          {selectedPages.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={confirmDeletion}
                color="error"
                data-testid="delete-page-btn"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedPages.length} <Translate>of</Translate>
              {pages.length}
            </div>
          )}
          {selectedPages.length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Link to="/settings/pages/page">
                  <Button styling="solid" color="primary" type="button">
                    <Translate>Add page</Translate>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {showModal && (
        <div className="container w-10 h-10">
          <ConfirmationModal
            header={<Translate>Are you sure?</Translate>}
            warningText={<Translate>Do you want to delete the following items?</Translate>}
            body={<List items={selectedPages} />}
            onAcceptClick={deleteSelected}
            onCancelClick={() => setShowModal(false)}
            size="lg"
          />
        </div>
      )}
    </div>
  );
};

export type { TablePage };
export { PagesList, pagesListLoader };
