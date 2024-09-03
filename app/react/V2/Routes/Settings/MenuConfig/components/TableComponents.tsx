/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'app/I18N';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Button } from 'app/V2/Components/UI';
import { Link } from '../shared';

const EditButton = ({ cell, column }: CellContext<Link, string>) => (
  <Button
    styling="light"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const TitleCell = ({ getValue }: CellContext<Link, string>) => (
  <div className="flex gap-2 items-center">
    <Translate context="Menu">{getValue()}</Translate>
  </div>
);

const TitleHeader = () => <Translate>Label</Translate>;
const URLHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const columnHelper = createColumnHelper<any>();
const columns = (actions: { edit: Function }) => [
  columnHelper.accessor('title', {
    id: 'title',
    header: TitleHeader,
    cell: TitleCell,
    enableSorting: false,
    meta: { headerClassName: 'w-6/12' },
  }),
  columnHelper.accessor('url', {
    header: URLHeader,
    enableSorting: false,
    meta: { headerClassName: 'w-6/12' },
  }),
  columnHelper.accessor('key', {
    header: ActionHeader,
    cell: EditButton,
    enableSorting: false,
    meta: { action: actions.edit },
  }),
];
export { EditButton, TitleHeader, URLHeader, TitleCell, columns };
