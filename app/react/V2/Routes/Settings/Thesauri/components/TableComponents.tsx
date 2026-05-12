/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { t, Translate } from '#app/I18N/index.js';
import { Button, Pill } from '#V2/Components/UI/index.js';
import { ClientThesaurus, ClientThesaurusValue } from '#app/apiResponseTypes.js';
import { ThesauriRow } from './ThesauriTable.js';

const TemplateHeader = () => <Translate>Templates</Translate>;

const ThesaurusLabel = ({ cell }: any) => {
  const translated = t(
    cell.row.original._id,
    cell.row.original.name,
    cell.row.original.name,
    false
  );
  const hidden = translated === cell.row.original.name;
  return (
    <div className="flex items-center">
      <span className="text-(--color-theme-text-primary)">{cell.row.original.name}</span>
      {hidden && (
        <div className="has-[span:not(.active)]:hidden ml-2 h-full rounded-lg border border-solid border-b-0 border-l-2 border-r-2 border-t-0 p-1 border-(--color-theme-border-default)">
          <Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>
        </div>
      )}
      {!hidden && (
        <div className="ml-2 h-full rounded-lg border border-solid border-b-0 border-l-2 border-r-2 border-t-0 p-1 border-(--color-theme-border-default)">
          <Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>
        </div>
      )}
    </div>
  );
};

const ActionHeader = () => <Translate>Action</Translate>;

const ThesaurusValueLabel = ({ getValue, cell }: CellContext<ThesaurusRow, string>) => {
  const { thesaurus } = cell.getContext().column.columnDef.meta!.data;
  const label = getValue();
  const translated = thesaurus?._id && t(thesaurus._id, label, label, false);
  const hidden = translated === label;
  return (
    <div className="flex items-center gap-2">
      <span className="text-(--color-theme-text-primary)">{label}</span>
      {thesaurus !== undefined && hidden && (
        <div className="has-[span:not(.active)]:hidden ml-2 h-full rounded-lg border border-solid border-b-0 border-l-2 border-r-2 border-t-0 p-1 border-(--color-theme-border-default)">
          <Translate context={thesaurus._id} className="text-(--color-theme-text-secondary)">
            {label}
          </Translate>
        </div>
      )}
      {thesaurus !== undefined && !hidden && (
        <div className="ml-2 h-full rounded-lg border border-solid border-b-0 border-l-2 border-r-2 border-t-0 p-1 border-(--color-theme-border-default)">
          <Translate context={thesaurus._id} className="text-(--color-theme-text-secondary)">
            {label}
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
    variant="ghost"
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

const columnHelperThesaurus = createColumnHelper<ThesaurusRow>();
const columnsThesaurus = (actions: { edit?: Function }, thesaurus: ClientThesaurus) => [
  columnHelperThesaurus.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: ThesaurusValueLabel,
    meta: { headerClassName: 'w-11/12', data: { thesaurus } },
  }),
  columnHelperThesaurus.accessor('id', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: {
      action: actions.edit,
    },
  }),
];

const columnHelperThesauri = createColumnHelper<ThesauriRow>();
const columnsThesauri = ({ edit }: { edit: Function }) => [
  columnHelperThesauri.accessor('name', {
    id: 'name',
    header: LabelHeader,
    cell: ThesaurusLabel,
    meta: { headerClassName: 'w-6/12 font-medium' },
  }),
  columnHelperThesauri.accessor('templates', {
    header: TemplateHeader,
    cell: templatesCells,
    enableSorting: false,
    meta: { headerClassName: 'w-6/12' },
  }),
  columnHelperThesauri.accessor('_id', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: { action: edit },
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
  columnsThesaurus,
  columnsThesauri,
};

export type { TableThesaurusValue, ThesaurusRow };
