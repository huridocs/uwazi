/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'app/V2/Components/UI';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import { ThesauriRow } from './ThesauriTable';

const TemplateHeader = () => <Translate>Templates</Translate>;

const ThesaurusLabel = ({ cell }: any) => (
  <div className="flex items-center">
    <span className="text-indigo-700">{cell.row.original.name}</span>
    <div className="h-full p-1 ml-2 border-2 border-gray-400 border-solid rounded-lg border-y-0">
      <Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>
    </div>
  </div>
);

const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const ThesaurusValueLabel = ({ getValue, cell }: CellContext<ThesaurusRow, string>) => {
  const { thesaurus } = cell.getContext().column.columnDef.meta!.data;
  return (
    <div className="flex items-center gap-2">
      <span className="text-indigo-700">{getValue()}</span>
      {thesaurus !== undefined && (
        <div className="h-full p-1 ml-2 border-2 border-gray-400 border-solid rounded-lg border-y-0">
          <Translate context={thesaurus._id} className="text-gray-700 ">
            {getValue()}
          </Translate>
        </div>
      )}
    </div>
  );
};

const templatesCells = ({ cell }: CellContext<ThesauriRow, any>) => (
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

const EditButton = ({
  cell,
  column,
}: CellContext<ThesauriRow, string> | CellContext<ThesaurusRow, string>) => (
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

const columnHelper = createColumnHelper<ThesaurusRow>();
const columns = (actions: { edit?: Function }, thesaurus: ClientThesaurus) => [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: ThesaurusValueLabel,
    meta: { headerClassName: 'w-11/12', data: { thesaurus } },
  }),
  columnHelper.accessor('id', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: {
      action: actions.edit,
    },
  }),
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
