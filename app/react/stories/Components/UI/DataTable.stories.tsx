import React from 'react';
import preview from '#storybook/preview';
import { DataTable } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/UI/DataTable',
  component: DataTable,
});

const columns = [
  {
    id: 'title',
    header: 'Title',
    cell: (row: { rowId: string; title: string }) => (
      <span className="font-medium text-ink">{row.title}</span>
    ),
    width: '18rem',
  },
  {
    id: 'year',
    header: 'Date',
    cell: (row: { rowId: string; year: string }) => (
      <span className="tabular-nums text-ink-tertiary">{row.year}</span>
    ),
    width: '6rem',
  },
];

const data = [
  { rowId: '1', title: 'Mexico', year: '2024' },
  { rowId: '2', title: 'Amnesty International', year: '2023' },
  { rowId: '3', title: 'Right to Privacy', year: '2024' },
];

const Comfortable = meta.story({
  render: () => (
    <div className="tw-content p-6">
      <DataTable columns={columns} data={data} density="comfortable" />
    </div>
  ),
});

const Compact = meta.story({
  render: () => (
    <div className="tw-content p-6">
      <DataTable columns={columns} data={data} density="compact" />
    </div>
  ),
});

export { Comfortable, Compact };
