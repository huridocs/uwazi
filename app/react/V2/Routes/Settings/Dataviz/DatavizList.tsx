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
import { CHART_TYPE_LABELS } from '#V2/Dataviz/types/chartTypes.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
type DatavizRow = DatavizDefinition & { rowId: string };

const REFRESH_MODE_LABELS: Record<DatavizDefinition['refresh']['refreshMode'], string> = {
  live: 'Live',
  snapshot_manual: 'Snapshot (manual)',
  snapshot_scheduled: 'Snapshot (scheduled)',
};

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

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const DatavizList = () => {
  const rows = useLoaderData() as DatavizRow[];
  const [selected, setSelected] = useState<DatavizRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

  const deleteSelected = async () => {
    setShowModal(false);
    const results = await Promise.all(selected.map(row => datavizAPI.remove(row.id)));
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
      header: () => <Translate>Name</Translate>,
      meta: { headerClassName: 'w-2/6' },
    }),
    columnHelper.accessor('chart.type', {
      id: 'chartType',
      header: () => <Translate>Chart</Translate>,
      cell: ({ getValue }) => CHART_TYPE_LABELS[getValue()] ?? getValue(),
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.accessor('refresh.refreshMode', {
      id: 'refreshMode',
      header: () => <Translate>Refresh</Translate>,
      cell: ({ row, getValue }) =>
        isManualDataSource(row.original.dataSource) ? (
          <Translate>Manual data</Translate>
        ) : (
          REFRESH_MODE_LABELS[getValue()] ?? getValue()
        ),
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.accessor('updatedAt', {
      header: () => <Translate>Last updated</Translate>,
      cell: ({ getValue }) => formatDate(getValue()),
      meta: { headerClassName: 'w-1/6' },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <Translate>Action</Translate>,
      cell: ({ row }) => (
        <I18NLink to={`/settings/dataviz/edit/${row.original.id}`}>
          <Button variant="ghost" className="leading-4">
            <Translate>Edit</Translate>
          </Button>
        </I18NLink>
      ),
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
