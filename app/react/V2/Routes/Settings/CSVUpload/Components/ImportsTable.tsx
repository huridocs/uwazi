/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ProgressBar, Table } from '#V2/Components/UI/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { CsvImportListRow } from '#V2/api/csv/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { csvLoaderResponse } from '../Loaders/csvListLoader';

type TableData = CsvImportListRow & { rowId: string; templateName: string };

const columnHelper = createColumnHelper<TableData>();

const StatusHeader = () => <Translate>Status</Translate>;
const FileHeader = () => <Translate>File</Translate>;
const TemplateHeader = () => <Translate>Template</Translate>;
const ProgressHeader = () => <Translate>Progress</Translate>;
const EntitiesHeader = () => <Translate>Entities</Translate>;
const FailedHeader = () => <Translate>Failed</Translate>;
const DateHeader = () => <Translate>Date</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const StatusCell = ({ cell }: CellContext<TableData, TableData['status']>) => {
  const status = cell.getValue();
  return <span className="uppercase">{status}</span>;
};

const FileCell = ({ cell }: CellContext<TableData, TableData['file']>) =>
  cell.getValue().originalName;

const ProgressCell = ({ cell }: CellContext<TableData, TableData['progress']>) => {
  const { totalRows = 0, processedRows = 1 } = cell.getValue() || {
    totalRows: 0,
    processedRows: 0,
  };

  const progress = useMemo(() => {
    const calculated = (totalRows / processedRows) * 100;
    if (Number.isNaN(calculated)) {
      return 0;
    }
    return calculated;
  }, [processedRows, totalRows]);

  return (
    <>
      <span className="sr-only">
        {totalRows}&frasl;{processedRows}
      </span>
      <ProgressBar progress={progress} />
    </>
  );
};

const DateCell = ({ cell }: CellContext<TableData, TableData['createdAt']>) => {
  const createdAt = cell.getValue();
  const locale = useAtomValue(localeAtom);

  if (Number.isNaN(createdAt)) {
    return '-';
  }

  let luxonInstance = DateTime.fromMillis(createdAt, { zone: 'utc' });

  luxonInstance = luxonInstance.setLocale(locale || 'en');

  return luxonInstance.toLocaleString(DateTime.DATE_MED);
};

const columns = [
  columnHelper.accessor('status', {
    header: StatusHeader,
    cell: StatusCell,
  }),
  columnHelper.accessor('file', {
    header: FileHeader,
    cell: FileCell,
    enableSorting: false,
  }),
  columnHelper.accessor('templateName', {
    header: TemplateHeader,
  }),
  columnHelper.accessor('progress', {
    header: ProgressHeader,
    cell: ProgressCell,
    enableSorting: false,
  }),
  columnHelper.accessor(row => row.stats?.entitiesCreated, {
    id: 'stats.entitiesCreated',
    enableSorting: false,
    header: EntitiesHeader,
  }),
  columnHelper.accessor(row => row.stats?.rowsFailed, {
    id: 'stats.rowsFailed',
    enableSorting: false,
    header: FailedHeader,
  }),
  columnHelper.accessor('createdAt', {
    header: DateHeader,
    cell: DateCell,
  }),
  columnHelper.accessor('id', { enableSorting: false, header: ActionHeader }),
];

const ImportsTable = () => {
  const { list: csvUploads } = useLoaderData() as csvLoaderResponse;
  const templates = useAtomValue(templatesAtom);

  const templatesById = useMemo(
    () => new Map(templates.map(template => [template._id as string, template.name])),
    [templates]
  );

  const { tableData, completed, processing, failed } = useMemo(() => {
    const dataForTable: TableData[] = [];
    let entriesInProccessing: number = 0;
    let entriesCompleted: number = 0;
    let entriesFailed: number = 0;

    csvUploads.forEach(entry => {
      dataForTable.push({
        ...entry,
        rowId: entry.id,
        templateName: templatesById.get(entry.templateId) || entry.templateId,
      });

      if (entry.status === 'completed') {
        entriesCompleted += 1;
      } else if (entry.status === 'processing') {
        entriesInProccessing += 1;
      } else if (entry.status === 'failed') {
        entriesFailed += 1;
      }
    });

    return {
      tableData: dataForTable,
      completed: entriesCompleted,
      processing: entriesInProccessing,
      failed: entriesFailed,
    };
  }, [csvUploads, templatesById]);

  return (
    <Table
      header={
        <div className="flex flex-col">
          <div>
            <span className="float-left" no-translate>
              CSVs
            </span>
            <div className="flex flex-row items-baseline gap-2 float-right">
              <ArrowPathIcon className="w-4 h-4" />
              <Translate>Auto-refreshing</Translate>
            </div>
          </div>
          <div className="flex flex-row gap-8">
            <div>
              <span>{csvUploads.length}</span>
              <Translate>Total imports</Translate>
            </div>
            <div>
              <span>{processing}</span>
              <Translate>Processing</Translate>
            </div>
            <div>
              <span>{completed}</span>
              <Translate>Completed</Translate>
            </div>
            <div>
              <span>{failed}</span>
              <Translate>Failed jobs</Translate>
            </div>
          </div>
        </div>
      }
      columns={columns}
      data={tableData}
    />
  );
};

export { ImportsTable };
