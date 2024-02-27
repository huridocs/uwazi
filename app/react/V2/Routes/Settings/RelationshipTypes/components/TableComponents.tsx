/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'app/I18N';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Button } from 'app/V2/Components/UI';
import { ClientRelationshipType } from 'app/apiResponseTypes';

const EditButton = ({ cell, column }: CellContext<ClientRelationshipType, string>) => (
  <Button
    styling="outline"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const TitleCell = ({ cell, getValue }: CellContext<ClientRelationshipType, string>) => (
  <div className="flex items-center gap-2">
    <Translate className="text-indigo-800" context={cell.row.original._id}>
      {getValue()}
    </Translate>
    ({getValue()})
  </div>
);

const TitleHeader = () => <Translate>Label</Translate>;

const columnHelper = createColumnHelper<any>();
const columns = (actions: { edit: Function }) => [
  columnHelper.accessor('name', {
    id: 'name',
    header: TitleHeader,
    cell: TitleCell,
    enableSorting: false,
    meta: { headerClassName: 'w-6/12' },
  }) as ColumnDef<ClientRelationshipType, 'name'>,
  columnHelper.accessor('key', {
    header: '',
    cell: EditButton,
    enableSorting: false,
    meta: { action: actions.edit, headerClassName: 'w-0 text-center' },
  }) as ColumnDef<ClientRelationshipType, 'key'>,
];
export { EditButton, TitleHeader, TitleCell, columns };
