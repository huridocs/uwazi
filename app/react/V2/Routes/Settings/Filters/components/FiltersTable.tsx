/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, EmbededButton } from 'V2/Components/UI';

const columnHelper = createColumnHelper<ClientSettingsFilterSchema>();

const TitleHeader = () => <Translate>Label</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const Filters = ({ row, getValue }: CellContext<ClientSettingsFilterSchema, string>) => (
  <div className="flex gap-2 items-center">
    <Translate
      context="Filters"
      className={row.getIsExpanded() ? 'text-indigo-700' : 'text-indigo-700'}
    >
      {getValue()}
    </Translate>
    {row.getCanExpand() && (
      <EmbededButton
        icon={row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => row.toggleExpanded()}
        color="indigo"
        className="bg-indigo-200 rounded-md border-none drop-shadow-none"
      >
        <Translate>Group</Translate>
      </EmbededButton>
    )}
  </div>
);

const ActionCell = ({ cell }: CellContext<ClientSettingsFilterSchema, any>) => {
  const actions = cell.column.columnDef.meta?.action
    ? cell.column.columnDef.meta?.action()
    : undefined;

  return (
    <Button
      styling="outline"
      color="primary"
      className="leading-3"
      onClick={() => actions.edit(cell.row.original)}
    >
      <Translate>Edit</Translate>
    </Button>
  );
};

const createColumns = () => [
  columnHelper.accessor('name', {
    id: 'name',
    header: TitleHeader,
    cell: Filters,
    meta: { headerClassName: 'w-full' },
  }),
  columnHelper.display({
    id: 'action',
    header: ActionHeader,
    cell: ActionCell,
    enableSorting: false,
    meta: {
      //   action: () => ({ delete: handleDelete, edit: editFile }),
      headerClassName: 'w-0 sr-only',
    },
  }),
];

export { createColumns };
