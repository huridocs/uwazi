/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { I18NLinkV2 as I18NLink, Translate } from '#app/I18N/index.js';
import { Button } from '#app/V2/Components/UI/index.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { CHART_TYPE_LABELS } from '#V2/Dataviz/types/chartTypes.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';

type DatavizRow = DatavizDefinition & { rowId: string };

const REFRESH_MODE_LABELS: Record<DatavizDefinition['refresh']['refreshMode'], string> = {
  live: 'Live',
  snapshot_manual: 'Snapshot (manual)',
  snapshot_scheduled: 'Snapshot (scheduled)',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const NameHeader = () => <Translate>Name</Translate>;

const ChartHeader = () => <Translate>Chart</Translate>;

const RefreshHeader = () => <Translate>Refresh</Translate>;

const UpdatedHeader = () => <Translate>Last updated</Translate>;

const ActionHeader = () => <Translate>Action</Translate>;

const ChartTypeCell = ({ getValue }: CellContext<DatavizRow, DatavizDefinition['chart']['type']>) =>
  CHART_TYPE_LABELS[getValue()] ?? getValue();

const RefreshModeCell = ({
  row,
  getValue,
}: CellContext<DatavizRow, DatavizDefinition['refresh']['refreshMode']>) => {
  if (isManualDataSource(row.original.dataSource)) {
    return <Translate>Manual data</Translate>;
  }
  return REFRESH_MODE_LABELS[getValue()] ?? getValue();
};

const UpdatedAtCell = ({ getValue }: CellContext<DatavizRow, string | undefined>) =>
  formatDate(getValue());

const ActionCell = ({ row }: CellContext<DatavizRow, unknown>) => (
  <I18NLink to={`/settings/dataviz/edit/${row.original.id}`}>
    <Button variant="ghost" className="leading-4">
      <Translate>Edit</Translate>
    </Button>
  </I18NLink>
);

export {
  NameHeader,
  ChartHeader,
  RefreshHeader,
  UpdatedHeader,
  ActionHeader,
  ChartTypeCell,
  RefreshModeCell,
  UpdatedAtCell,
  ActionCell,
};
