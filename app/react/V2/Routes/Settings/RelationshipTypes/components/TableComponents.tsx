/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'app/I18N';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Button, Pill } from 'app/V2/Components/UI';
import { ClientRelationshipType, Template } from 'app/apiResponseTypes';
interface TableRelationshipType extends ClientRelationshipType {
  templates: Template[];
  disableRowSelection: boolean;
}

const EditButton = ({ cell, column }: CellContext<TableRelationshipType, string>) => (
  <Button
    styling="outline"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const TitleCell = ({ cell, getValue }: CellContext<TableRelationshipType, string>) => (
  <div className="flex items-center gap-2">
    <Translate className="text-indigo-800" context={cell.row.original._id}>
      {getValue()}
    </Translate>
    ({getValue()})
  </div>
);

const templatesCells = ({
  cell,
}: CellContext<TableRelationshipType, TableRelationshipType['templates']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue()?.map(template => (
      <div key={cell.id + template._id}>
        <Pill color="gray" className="whitespace-nowrap">
          <Translate context={template._id}>{template.name}</Translate>
        </Pill>
      </div>
    ))}
  </div>
);

const TitleHeader = () => <Translate>Label</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;
const TemplateHeader = () => <Translate>Templates</Translate>;

const columnHelper = createColumnHelper<any>();
const columns = (actions: { edit: Function }) => [
  columnHelper.accessor('name', {
    id: 'name',
    header: TitleHeader,
    cell: TitleCell,
    enableSorting: true,
    meta: { headerClassName: 'w-1/2' },
  }) as ColumnDef<TableRelationshipType, 'name'>,
  columnHelper.accessor('templates', {
    header: TemplateHeader,
    cell: templatesCells,
    enableSorting: false,
    meta: { headerClassName: 'w-1/2' },
  }) as ColumnDef<TableRelationshipType, 'templates'>,
  columnHelper.accessor('key', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: { action: actions.edit, headerClassName: 'w-0 text-center' },
  }) as ColumnDef<TableRelationshipType, 'key'>,
];
export { EditButton, TitleHeader, TitleCell, columns };
export type { TableRelationshipType };
