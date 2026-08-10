/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper, Row } from '@tanstack/react-table';
import { I18NLinkV2 as I18NLink, Translate, t } from '#app/I18N/index.js';
import { Button, StatusBadge } from '#V2/Components/UI/index.js';
import type { SyncConfigPublic } from '../types.js';

type SyncRow = SyncConfigPublic & { rowId: string };

const columnHelper = createColumnHelper<SyncRow>();

const NameHeader = () => <Translate>Name</Translate>;
const UrlHeader = () => <Translate>Remote URL</Translate>;
const StatusHeader = () => <Translate>Status</Translate>;
const PendingHeader = () => <Translate>Pending</Translate>;
const ActionsHeader = () => <Translate>Actions</Translate>;

const StatusCell = ({ row }: CellContext<SyncRow, unknown>) =>
  row.original.active ? (
    <StatusBadge tone="success" label={t('System', 'Active', null, false)} />
  ) : (
    <StatusBadge tone="muted" label={t('System', 'Inactive', null, false)} />
  );

const PendingCell = ({ getValue, row }: CellContext<SyncRow, number>) =>
  row.original.active ? (
    <span className="text-sm text-ink">
      {getValue()} <Translate>changes</Translate>
    </span>
  ) : (
    <span className="text-sm text-ink-tertiary">—</span>
  );

const ActionsCell = ({ row, column }: CellContext<SyncRow, unknown>) => (
  <div className="flex justify-end gap-2">
    <Button
      type="button"
      variant="secondary"
      size="small"
      onClick={() => column.columnDef.meta?.action?.(row)}
    >
      {row.original.active ? <Translate>Deactivate</Translate> : <Translate>Activate</Translate>}
    </Button>
    <I18NLink to={`/settings/sync/edit/${encodeURIComponent(row.original.name)}`}>
      <Button type="button" variant="secondary" size="small">
        <Translate>Edit</Translate>
      </Button>
    </I18NLink>
  </div>
);

const columns = (actions: { onToggle: (row: Row<SyncRow>) => void }) => [
  columnHelper.accessor('name', {
    header: NameHeader,
    meta: { headerClassName: 'w-1/5' },
  }),
  columnHelper.accessor('url', {
    header: UrlHeader,
    meta: { headerClassName: 'w-2/5' },
  }),
  columnHelper.accessor(row => row.active, {
    id: 'active',
    header: StatusHeader,
    cell: StatusCell,
    meta: { headerClassName: 'w-1/6' },
  }),
  columnHelper.accessor(row => row.status?.pendingChanges ?? 0, {
    id: 'pending',
    header: PendingHeader,
    cell: PendingCell,
    meta: { headerClassName: 'w-1/6' },
  }),
  columnHelper.display({
    id: 'actions',
    header: ActionsHeader,
    cell: ActionsCell,
    enableSorting: false,
    meta: {
      action: actions.onToggle,
      headerClassName: 'w-0 text-right',
      contentClassName: 'text-right',
    },
  }),
];

export { columns };
export type { SyncRow };
