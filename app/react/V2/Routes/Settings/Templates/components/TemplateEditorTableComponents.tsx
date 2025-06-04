/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Button } from 'V2/Components/UI/Button';
import { ColumnDef, createColumnHelper, CellContext } from '@tanstack/react-table';
import { PropertySchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N/Translate';
import { propertyIcons } from 'V2/Components/UI/Icons';

export type PropertyRow = PropertySchema & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

const columnHelper = createColumnHelper<PropertyRow>();

const LabelCell = ({ cell }: CellContext<PropertyRow, string>) => <span>{cell.getValue()}</span>;
const TypeCell = ({ cell }: CellContext<PropertyRow, string>) => (
  <div className="flex items-center gap-2">
    {propertyIcons[cell.getValue() as keyof typeof propertyIcons]}
    <Translate className="capitalize">{cell.getValue()}</Translate>
  </div>
);
const ActionsCell = () => (
  <Button size="small" styling="light">
    <Translate>Edit</Translate>
  </Button>
);

const LabelHeader = () => <Translate>Property</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;
const ActionsHeader = () => <Translate>Options</Translate>;

export const propertyColumns: ColumnDef<PropertyRow, any>[] = [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: LabelCell,
    meta: { headerClassName: 'w-6/12' },
    enableSorting: false,
  }),
  columnHelper.accessor('type', {
    id: 'type',
    header: TypeHeader,
    cell: TypeCell,
    meta: { headerClassName: 'w-6/12' },
    enableSorting: false,
  }),
  {
    id: 'actions',
    header: ActionsHeader,
    cell: ActionsCell,
    meta: { headerClassName: 'w-0 text-center', contentClassName: 'text-center' },
  },
];
