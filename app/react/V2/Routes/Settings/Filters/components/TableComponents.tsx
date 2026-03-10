/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI';
import { sidepanelAtom } from './sidepanelAtom';
import { Filter } from './helpers';

const columnHelper = createColumnHelper<Filter>();

const TitleHeader = () => <Translate>Label</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const Filters = ({ getValue }: CellContext<Filter, string>) => (
  <div className="flex gap-2 items-center">{getValue()}</div>
);

const ActionCell = ({ cell, row }: CellContext<Filter, any>) => {
  const action = cell.column.columnDef.meta?.action;
  const setAtom = useSetAtom(sidepanelAtom);

  if (row.originalSubRows) {
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
  }

  return undefined;
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
    meta: { action: setSidepanel },
  }),
];

export { createColumns };
