/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { Link, LoaderFunction, useLoaderData, useParams, useRevalidator } from 'react-router-dom';
import { createColumnHelper, Row } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { useSetRecoilState } from 'recoil';
import { Translate, t } from 'app/I18N';
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
  EditButton,
  UrlCell,
} from './components/PageListTable';

const pagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) =>
    pagesAPI.get(params.lang || 'en', headers);

const deletionNotification: (hasErrors: boolean) => notificationAtomType = hasErrors => ({
  type: !hasErrors ? 'success' : 'error',
  text: !hasErrors ? (
    <Translate>Deleted successfully.</Translate>
  ) : (
    <Translate>An error occurred</Translate>
  ),
});
// eslint-disable-next-line max-statements
const PagesList = () => {
  const [selectedPages, setSelectedPages] = useState<Row<Page>[]>([]);
  const [showModal, setShowModal] = useState(false);
  const pages = useLoaderData() as Page[];
  const revalidator = useRevalidator();
  const params = useParams();
  const setNotifications = useSetRecoilState(notificationAtom);

  const columnHelper = createColumnHelper<Page>();

  const deleteSelected = async () => {
    setShowModal(false);
    const sharedIds = selectedPages.map(row => row.original.sharedId);
    const result = await Promise.all(
      sharedIds.map(async sharedId => pagesAPI.deleteBySharedId(sharedId!))
    );
    const hasErrors = result.find(res => res instanceof FetchResponseError) !== undefined;
    setNotifications(deletionNotification(hasErrors));
    revalidator.revalidate();
  };

  const columns = [
    columnHelper.accessor('entityView', {
      header: EntityViewHeader,
      cell: YesNoPill,
    }),
    columnHelper.accessor('title', {
      header: TitleHeader,
    }),
    columnHelper.accessor('sharedId', {
      header: UrlHeader,
      cell: UrlCell,
    }),
    columnHelper.accessor('sharedId', {
      id: 'action',
      header: () => '',
      cell: EditButton,
      enableSorting: false,
      meta: { headerClassName: 'sr-only' },
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
          <Table<Page>
            columns={columns}
            data={pages}
            enableSelection
            title={<Translate>Pages</Translate>}
            onSelection={setSelectedPages}
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
                <Link to={`/${params.lang || 'en'}/settings/pages/page`}>
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
            header={t('System', 'Are you sure?', null, false)}
            body={t('System', 'You are about to delete a page', null, false)}
            onAcceptClick={deleteSelected}
            onCancelClick={() => setShowModal(false)}
            size="md"
          />
        </div>
      )}
    </div>
  );
};
export { PagesList, pagesListLoader };
