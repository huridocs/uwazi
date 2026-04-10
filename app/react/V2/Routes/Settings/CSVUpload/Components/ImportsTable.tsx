/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLoaderData, useRevalidator } from 'react-router';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import throttle from 'lodash/throttle';
import { ArrowPathIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { socket } from '#app/socket.js';
import { Table, Button, BlankState } from '#V2/Components/UI/index.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { CsvImportStatus } from '#V2/api/csv/index.js';
import type { CsvImportListRow } from '#V2/api/csv/index.js';
import type { CsvImportEventPayloads } from '#V2/api/csv/events.js';
import type { csvLoaderResponse } from '../Loaders/csvListLoader';
import { statusMessages } from './statusMessages.js';
import { DateDisplay } from './DateDisplay';
import { Progress } from './Progress';

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
  return <span>{statusMessages[status].title}</span>;
};

const FileCell = ({ cell }: CellContext<TableData, TableData['file']>) =>
  cell.getValue().originalName;

const ProgressCell = ({ cell }: CellContext<TableData, TableData['progress']>) => {
  const { totalRows, processedRows } = cell.getValue() || {
    totalRows: 0,
    processedRows: 0,
  };

  return <Progress current={processedRows} total={totalRows} status={cell.row.original.status} />;
};

const DateCell = ({ cell }: CellContext<TableData, TableData['createdAt']>) => {
  const createdAt = cell.getValue();
  return <DateDisplay value={createdAt} />;
};

const ActionCell = ({ cell }: CellContext<TableData, TableData['id']>) => (
  <Link to={cell.getValue()}>
    <Button styling="light">
      <Translate>View</Translate>
    </Button>
  </Link>
);

const TemplateCell = ({ cell }: CellContext<TableData, TableData['templateName']>) =>
  t(cell.row.original.templateId, cell.getValue(), null, false);

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
    cell: TemplateCell,
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
  columnHelper.accessor('id', { enableSorting: false, header: ActionHeader, cell: ActionCell }),
];

const toTableRow = (entry: CsvImportListRow, templatesById: Map<string, string>): TableData => ({
  ...entry,
  rowId: entry.id,
  templateName: templatesById.get(entry.templateId) || entry.templateId,
});

const ImportsTable = () => {
  const { list: csvUploads } = useLoaderData() as csvLoaderResponse;
  const templates = useAtomValue(templatesAtom);
  const revalidator = useRevalidator();
  const [tableData, setTableData] = useState<TableData[]>([]);

  const templatesById = useMemo(
    () => new Map(templates.map(template => [template._id as string, template.name])),
    [templates]
  );

  const { completed, processing, failed } = useMemo(() => {
    let entriesInProccessing = 0;
    let entriesCompleted: number = 0;
    let entriesFailed: number = 0;

    tableData.forEach(entry => {
      if (entry.status === CsvImportStatus.Completed) {
        entriesCompleted += 1;
      } else if (entry.status === CsvImportStatus.Processing) {
        entriesInProccessing += 1;
      } else if (entry.status === CsvImportStatus.Failed) {
        entriesFailed += 1;
      }
    });

    return {
      completed: entriesCompleted,
      processing: entriesInProccessing,
      failed: entriesFailed,
    };
  }, [tableData]);

  useEffect(() => {
    setTableData(csvUploads.map(entry => toTableRow(entry, templatesById)));
  }, [csvUploads, templatesById]);

  useEffect(() => {
    const onStart = async () => {
      await revalidator.revalidate();
    };

    const doRevalidation = throttle(async () => {
      await revalidator.revalidate();
    }, 3000);

    const onImportProgress = throttle(
      (payload: CsvImportEventPayloads['csvImport:import:progress']) => {
        setTableData(prev =>
          prev.map(row => {
            if (row.id !== payload.importId) {
              return row;
            }

            return {
              ...row,
              progress: {
                totalRows: payload.totalRows,
                processedRows: payload.processedRows,
                lastProcessedRow: row.progress?.lastProcessedRow ?? 0,
                batchSize: row.progress?.batchSize ?? 0,
              },
            };
          })
        );
      },
      3000
    );

    socket.on(csvImportEvents.importStart, onStart);
    socket.on(csvImportEvents.importProgress, onImportProgress);
    socket.on(csvImportEvents.importSuccess, doRevalidation);
    socket.on(csvImportEvents.importError, doRevalidation);

    return () => {
      socket.off(csvImportEvents.importStart, onStart);
      socket.off(csvImportEvents.importProgress, onImportProgress);
      socket.off(csvImportEvents.importSuccess, doRevalidation);
      socket.off(csvImportEvents.importError, doRevalidation);
    };
  }, [revalidator]);

  if (!tableData.length) {
    return (
      <div className="max-w-80 m-auto">
        <BlankState
          icon={
            <div className="bg-[#F5EED7] border rounded-full p-4">
              <DocumentIcon className="w-6 h-6 text-gray-900" />
            </div>
          }
          title={<Translate>No CSVs yet</Translate>}
          description={
            <Translate translationKey="csv blank state message">
              Import CSV or ZIP files to create entities in bulk. Click &quot;New Import&quot; to
              get started.
            </Translate>
          }
        />
      </div>
    );
  }

  return (
    <Table
      defaultSorting={[{ id: 'createdAt', desc: true }]}
      header={
        <div className="flex flex-col gap-4">
          <div>
            <span className="float-left text-xl font-semibold" no-translate="true">
              CSVs
            </span>
            <div className="flex flex-row items-center gap-2 float-right text-gray-400 text-sm">
              <ArrowPathIcon className="w-4 h-4" />
              <Translate>Auto-refreshing</Translate>
            </div>
          </div>
          <div className="flex flex-row gap-8 items-center">
            <div className="flex flex-row gap-2 items-center">
              <span className="font-semibold text-lg text-black">{tableData.length}</span>
              <Translate>Total imports</Translate>
            </div>
            <span className="min-h-5 border-l" />
            <div className="flex flex-row gap-2 items-center">
              <span className="font-semibold text-lg text-indigo-500">{processing}</span>
              <Translate>Processing</Translate>
            </div>
            <span className="min-h-5 border-l" />
            <div className="flex flex-row gap-2 items-center">
              <span className="font-semibold text-lg text-black">{completed}</span>
              <Translate>Completed</Translate>
            </div>
            <span className="min-h-5 border-l" />
            <div className="flex flex-row gap-2 items-center">
              <span className="font-semibold text-lg text-red-600">{failed}</span>
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
