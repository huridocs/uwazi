/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { I18NLinkV2 as I18NLink, Translate, t } from '#app/I18N/index.js';
import * as pagesAPI from '#V2/api/pages/index.js';
import { Button, ConfirmationModal, Table } from '#app/V2/Components/UI/index.js';
import { SettingsContent } from '#app/V2/Components/Layouts/SettingsContent.js';
import { Page } from '#app/V2/shared/types.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  EntityViewHeader,
  YesNoPill,
  TitleHeader,
  UrlHeader,
  ActionCell,
  UrlCell,
  ActionHeader,
  List,
} from './components/PageListTable.js';

type TablePage = Page & { rowId: string };

const pagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    (await pagesAPI.get(headers)).map(page => ({ ...page, rowId: page._id }));

const columnHelper = createColumnHelper<TablePage>();

const PagesList = () => {
  const [selectedPages, setSelectedPages] = useState<TablePage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const pages = useLoaderData() as TablePage[];
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

  const deleteSelected = async () => {
    setShowModal(false);
    const sharedIds = selectedPages.map(row => row.sharedId);
    const result = await Promise.all(
      sharedIds.map(async sharedId => pagesAPI.deleteBySharedId(sharedId!))
    );
    const hasErrors = result.find(res => res instanceof FetchResponseError) !== undefined;
    if (hasErrors) {
      notify('error', t('System', 'An error occurred', null, false));
    } else {
      notify('success', t('System', 'Deleted successfully.', null, false));
    }
    await revalidator.revalidate();
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
    <div className="w-full h-full overflow-y-auto" data-testid="settings-pages">
      <SettingsContent>
        <SettingsContent.Header title="Pages" />
        <SettingsContent.Body>
          <Table
            columns={columns}
            data={pages}
            enableSelections
            header={
              <Translate className="text-left text-base font-semibold text-ink">Pages</Translate>
            }
            onSelect={({ selectedRows }) => {
              setSelectedPages(pages.filter(page => page.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'title', desc: false }]}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer highlighted={selectedPages.length > 0}>
          {selectedPages.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={confirmDeletion}
                variant="danger"
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
                <I18NLink to="/settings/pages/new">
                  <Button variant="primary" type="button">
                    <Translate>Add page</Translate>
                  </Button>
                </I18NLink>
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
