/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ClientSettingsFilterSchema } from 'app/apiResponseTypes';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, EmbededButton } from 'V2/Components/UI';
import { sidepanelAtom } from './sidepanelAtom';

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

const ActionCell = ({ cell, row }: CellContext<ClientSettingsFilterSchema, any>) => {
  const action = cell.column.columnDef.meta?.action;
  const setAtom = useSetAtom(sidepanelAtom);

  if (!cell.getIsAggregated()) {
    return undefined;
  }

  return (
    <Button
      styling="outline"
      color="primary"
      className="leading-3"
      onClick={() => {
        if (action) {
          setAtom(row.original);
          action(true);
        }
      }}
    >
      <Translate>Edit</Translate>
    </Button>
  );
};

const createColumns = (setSidepanel: React.Dispatch<React.SetStateAction<boolean>>) => [
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
      action: setSidepanel,
      headerClassName: 'w-0 sr-only',
    },
  }),
];

export { createColumns };
