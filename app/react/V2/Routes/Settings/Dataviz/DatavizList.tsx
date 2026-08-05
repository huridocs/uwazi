/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { I18NLinkV2 as I18NLink, Translate, t } from '#app/I18N/index.js';
import * as datavizAPI from '#V2/api/dataviz/index.js';
import { Button, ConfirmationModal, Table } from '#app/V2/Components/UI/index.js';
import { SettingsContent } from '#app/V2/Components/Layouts/SettingsContent.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  ActionCell,
  ActionHeader,
  ChartHeader,
  ChartTypeCell,
  NameHeader,
  RefreshHeader,
  RefreshModeCell,
  UpdatedAtCell,
  UpdatedHeader,
} from './components/TableComponents.js';
type DatavizRow = DatavizDefinition & { rowId: string };

const datavizListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const rows = await datavizAPI.list(headers);
    if (rows instanceof FetchResponseError) {
      throw rows;
    }
    return rows.map(row => ({ ...row, rowId: row.id }));
  };

const columnHelper = createColumnHelper<DatavizRow>();

const DatavizList = () => {
  const rows = useLoaderData() as DatavizRow[];
  const [selected, setSelected] = useState<DatavizRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

  const deleteSelected = async () => {
    setShowModal(false);
    const results = await Promise.all(selected.map(async row => datavizAPI.remove(row.id)));
    const hasErrors = results.some(res => res instanceof FetchResponseError);
    if (hasErrors) {
      notify('error', t('System', 'An error occurred', null, false));
    } else {
      notify('success', t('System', 'Deleted successfully.', null, false));
    }
    setSelected([]);
    await revalidator.revalidate();
  };

  const columns = [
    columnHelper.accessor('name', {
      header: NameHeader,
      meta: { headerClassName: 'w-2/6' },
    }),
    columnHelper.accessor('chart.type', {
      id: 'chartType',
      header: ChartHeader,
      cell: ChartTypeCell,
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.accessor('refresh.refreshMode', {
      id: 'refreshMode',
      header: RefreshHeader,
      cell: RefreshModeCell,
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.accessor('updatedAt', {
      header: UpdatedHeader,
      cell: UpdatedAtCell,
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.display({
      id: 'actions',
      header: ActionHeader,
      cell: ActionCell,
      enableSorting: false,
      meta: { headerClassName: 'w-0 text-right', contentClassName: 'text-right' },
    }),
  ];

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-dataviz">
      <SettingsContent>
        <SettingsContent.Header title="Data visualizations" />
        <SettingsContent.Body>
          <Table
            columns={columns}
            data={rows}
            enableSelections
            header={
              <Translate className="text-left text-base font-semibold text-ink">
                Data visualizations
              </Translate>
            }
            onSelect={({ selectedRows }) => {
              setSelected(rows.filter(row => row.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'name', desc: false }]}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer highlighted={selected.length > 0}>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => setShowModal(true)} variant="danger">
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selected.length} <Translate>of</Translate>
              {rows.length}
            </div>
          )}
          {selected.length === 0 && (
            <I18NLink to="/settings/dataviz/new">
              <Button variant="primary" type="button">
                <Translate>Create visualization</Translate>
              </Button>
            </I18NLink>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {showModal && (
        <ConfirmationModal
          header={t('System', 'Delete', null, false)}
          body={
            <Translate>
              Are you sure you want to delete the selected visualizations? This action cannot be
              undone.
            </Translate>
          }
          onAcceptClick={deleteSelected}
          onCancelClick={() => setShowModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { DatavizList, datavizListLoader };
