import React from 'react';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, EmbededButton, Pill } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import ChevronUpIcon from '@heroicons/react/20/solid/ChevronUpIcon';
import ChevronDownIcon from '@heroicons/react/20/solid/ChevronDownIcon';
import { ClientThesaurusValue } from 'app/apiResponseTypes';

const TemplateHeader = () => <Translate>Templates</Translate>;

const ThesaurusLabel = ({ cell }: any) => (
  <div className="flex items-center ">
    <span className="text-indigo-700">{cell.row.original.name}</span>
    &nbsp;
    {'('}
    <Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>
    {')'}
  </div>
);

const ActionHeader = () => <Translate>Action</Translate>;

const ThesaurusValueLabel = ({ row, getValue }: CellContext<ThesaurusValueSchema, string>) => (
  <div className="flex items-center gap-2">
    <Translate
      context="Menu"
      className={row.getIsExpanded() ? 'text-indigo-700' : 'text-indigo-700'}
    >
      {getValue()}
    </Translate>
    {row.getCanExpand() && (
      <EmbededButton
        icon={row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => row.toggleExpanded()}
        color="indigo"
        className="bg-indigo-200 border-none rounded-md drop-shadow-none"
      >
        <Translate>Group</Translate>
      </EmbededButton>
    )}
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
    styling="action"
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

const columnHelper = createColumnHelper<any>();
const columns = (actions: { edit: Function }) => [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: ThesaurusValueLabel,
    meta: { headerClassName: 'w-11/12' },
  }) as ColumnDef<TableThesaurusValue, 'label'>,
  columnHelper.accessor('_id', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: {
      action: actions.edit,
      headerClassName: 'text-center w-0',
    },
  }) as ColumnDef<TableThesaurusValue, '_id'>,
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

export type { TableThesaurusValue };
