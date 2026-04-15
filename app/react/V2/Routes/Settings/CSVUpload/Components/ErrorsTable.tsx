/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/index.js';
import type { CsvImportListRow, RowError } from '#V2/api/csv/index.js';

type TableData = RowError & { rowId: string };

const columnHelper = createColumnHelper<TableData>();

const RowIndexHeader = () => <Translate>Row</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const MessageHeader = () => <Translate>Message</Translate>;
const PropertyCell = ({ cell }: CellContext<TableData, TableData['property']>) =>
  cell.getValue() || '-';

const columns = [
  columnHelper.accessor('rowIndex', { header: RowIndexHeader, meta: { headerClassName: 'w-1/4' } }),
  columnHelper.accessor('property', {
    header: PropertyHeader,
    cell: PropertyCell,
    meta: { headerClassName: 'w-1/4' },
  }),
  columnHelper.accessor('message', {
    header: MessageHeader,
    meta: { headerClassName: 'w-2/4' },
    enableSorting: false,
  }),
];

const ErrorsTable = ({ errors }: { errors: CsvImportListRow['rowErrors'] }) => {
  const tableData = (errors || []).map((error, index) => ({
    ...error,
    //we add two so that the number matches CSV row numbers in spreadsheet editors
    rowIndex: error.rowIndex + 2,
    rowId: index.toString(),
  }));

  return (
    <Table
      header={<Translate>Failure details</Translate>}
      defaultSorting={[{ id: 'rowIndex', desc: true }]}
      columns={columns}
      data={tableData}
    />
  );
};

export { ErrorsTable };
