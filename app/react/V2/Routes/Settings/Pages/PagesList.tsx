/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { Link, LoaderFunction, useLoaderData } from 'react-router-dom';
import { CellContext, createColumnHelper, Row } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { useSetRecoilState } from 'recoil';
import { Translate } from 'app/I18N';
import * as pagesAPI from 'V2/api/pages';
import { Button, ConfirmationModal, Pill, Table } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Page } from 'app/V2/shared/types';
import { pagesAtom } from 'app/V2/atoms/pagesAtom';

const pagesListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    pagesAPI.get(headers);

const EntityViewHeader = () => <Translate>Entity Page</Translate>;
const TitleHeader = () => <Translate>Language</Translate>;
const UrlHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const EditButton = ({ cell }: CellContext<Page, string>) => (
  <Link to={`/settings/pages/page/${cell.getValue()}`}>
    <Button styling="outline" className="leading-4">
      <Translate>Edit</Translate>
    </Button>
  </Link>
);

const YesNoPill = ({ cell }: CellContext<Page, boolean>) => {
  const color = cell.getValue() ? 'primary' : 'gray';
  const entityViewLabel = cell.getValue() ? <Translate>Yes</Translate> : <Translate>No</Translate>;
  return <Pill color={color}>{entityViewLabel}</Pill>;
};

const PagesList = () => {
  const setPages = useSetRecoilState(pagesAtom);

  const [selectedPages, setSelectedPages] = useState<Row<Page>[]>([]);
  const [showModal, setShowModal] = useState(false);
  const pages = useLoaderData() as Page[];

  const columnHelper = createColumnHelper<Page>();

  const deleteSelected = async () => {
    const sharedIds = selectedPages.map(row => row.original.sharedId);
    await Promise.all(sharedIds.map(async sharedId => pagesAPI.deleteBySharedId(sharedId!)));
    setPages(prev => prev.filter(page => !sharedIds.includes(page.sharedId)));
  };

  const columns = [
    columnHelper.accessor('entityView', {
      header: EntityViewHeader,
      enableSorting: true,
      cell: YesNoPill,
    }),
    columnHelper.accessor('title', {
      header: TitleHeader,
      enableSorting: true,
    }),
    columnHelper.accessor('sharedId', {
      header: UrlHeader,
      enableSorting: true,
    }),
    columnHelper.accessor('sharedId', {
      header: ActionHeader,
      cell: EditButton,
    }),
  ];
  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-pages"
    >
      <SettingsContent>
        <SettingsContent.Header title="Languages" />
        <SettingsContent.Body>
          <Table<Page>
            columns={columns}
            data={pages}
            enableSelection
            onSelection={setSelectedPages}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedPages.length ? 'bg-primary-50' : ''}>
          {selectedPages.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={deleteSelected}
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
            header="Are you sure?"
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
