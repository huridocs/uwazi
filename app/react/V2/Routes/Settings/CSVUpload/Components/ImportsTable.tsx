/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/index.js';
import type { CsvImportListRow } from '#V2/api/csv/index.js';
import type { csvLoaderResponse } from '../Loaders/csvListLoader';

const columnHelper = createColumnHelper<CsvImportListRow & { rowId: string }>();

const StatusHeader = () => <Translate>Status</Translate>;
const FileHeader = () => <Translate>File</Translate>;
const TemplateHeader = () => <Translate>Template</Translate>;
const ProgressHeader = () => <Translate>Template</Translate>;
const EntitiesHeader = () => <Translate>Entities</Translate>;
const FailedHeader = () => <Translate>Failed</Translate>;
const DateHeader = () => <Translate>Date</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const columns = [
  columnHelper.accessor('status', {
    header: StatusHeader,
  }),
  columnHelper.accessor('file', {
    header: FileHeader,
  }),
  columnHelper.accessor('templateId', {
    header: TemplateHeader,
  }),
  columnHelper.accessor('progress', {
    header: ProgressHeader,
  }),
  columnHelper.accessor('stats.entitiesCreated', { header: EntitiesHeader }),
  columnHelper.accessor('stats.rowsFailed', { header: FailedHeader }),
  columnHelper.accessor('createdAt', { header: DateHeader }),
  columnHelper.accessor('id', { header: ActionHeader }),
];

const ImportsTable = () => {
  const { list: csvUploads } = useLoaderData() as csvLoaderResponse;

  const tableData = useMemo(
    () => csvUploads.map(entry => ({ ...entry, rowId: entry.id })),
    [csvUploads]
  );

  return <Table columns={columns} data={tableData} />;
};

export { ImportsTable };
