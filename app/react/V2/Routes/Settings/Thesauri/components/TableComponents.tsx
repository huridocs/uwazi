/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { ClientThesaurusValue } from 'app/apiResponseTypes';

const TemplateHeader = () => <Translate>Templates</Translate>;

const ThesaurusLabel = ({ cell }: any) => (
  <div className="flex items-center ">
    <span className="text-indigo-700">{cell.row.original.name}</span>
    &nbsp; (<Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>)
  </div>
);

const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const ThesaurusValueLabel = ({ row, getValue }: CellContext<ThesaurusValueSchema, string>) => (
  <div className="flex items-center gap-2">
    <Translate
      context="Menu"
      className={row.getIsExpanded() ? 'text-indigo-700' : 'text-indigo-700'}
    >
      {getValue()}
    </Translate>
  </div>
);

const templatesCells = ({ cell }: CellContext<any, any>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue()?.map((template: any) => (
      <div key={cell.id + template._id}>
        <Pill color="gray" className="whitespace-nowrap">
          <Translate context={template._id}>{template.name}</Translate>
        </Pill>
      </div>
    ))}
  </div>
);

const EditButton = ({ cell, column }: CellContext<ThesaurusSchema, string>) => (
  <Button
    styling="light"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const LabelHeader = () => <Translate>Label</Translate>;

interface TableThesaurusValue extends ClientThesaurusValue, Omit<ClientThesaurusValue, 'values'> {
  values?: {
    _id: string;
    id?: string;
    label: string;
    name?: string;
  }[];
}

interface ThesaurusRow extends Omit<ClientThesaurusValue, 'values'> {
  id?: string;
  rowId: string;
  label: string;
  subRows?: Omit<ThesaurusRow, 'subRows'>[];
  groupId?: string;
}

const columnHelper = createColumnHelper<any>();
const columns = (actions: { edit?: Function }) => [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: ThesaurusValueLabel,
    meta: { headerClassName: 'w-11/12' },
  }) as ColumnDef<ThesaurusRow, 'label'>,
  columnHelper.accessor('_id', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: {
      action: actions.edit,
    },
  }) as ColumnDef<ThesaurusRow, '_id'>,
];

export {
  ThesaurusLabel,
  LabelHeader,
  EditButton,
  ThesaurusValueLabel,
  ActionHeader,
  templatesCells,
  TemplateHeader,
  columns,
};

export type { TableThesaurusValue, ThesaurusRow };
