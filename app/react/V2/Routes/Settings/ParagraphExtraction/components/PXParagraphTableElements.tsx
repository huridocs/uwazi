/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI';
import { PXParagraphTable } from '../types';

const pxColumnHelper = createColumnHelper<PXParagraphTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);
const TemplateHeader = () => (
  <TableHeaderContainer>
    <Translate>Paragraph #</Translate>
  </TableHeaderContainer>
);
const EntityHeader = () => (
  <TableHeaderContainer>
    <Translate>Text</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => (
  <TableHeaderContainer>
    <Translate>Action</Translate>
  </TableHeaderContainer>
);

const DisplayCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['text']>) => (
  <span className="text-xs font-normal text-gray-900 line-clamp-2 overflow-ellipsis">
    {cell.getValue()}
  </span>
);

const ParagraphNoCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['rowId']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center justify-center">
    {cell.getValue()}
  </span>
);

const ViewButton = (
  { cell }: CellContext<PXParagraphTable, PXParagraphTable['_id']>,
  actions: () => void
) => (
  <Button className="leading-4" styling="outline" onClick={() => actions()}>
    <Translate>View</Translate>
  </Button>
);

const tableColumns = [
  pxColumnHelper.accessor('rowId', {
    header: TemplateHeader,
    cell: ParagraphNoCell,
    enableSorting: false,
  }),
  pxColumnHelper.accessor('text', {
    header: EntityHeader,
    cell: DisplayCell,
    meta: { headerClassName: 'w-5/6' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('_id', {
    header: ActionHeader,
    cell: props => ViewButton(props, () => console.log(props.cell.getValue())),
    enableSorting: false,
  }),
];

const getTableColumns = () => [
  pxColumnHelper.accessor('rowId', {
    header: TemplateHeader,
    cell: ParagraphNoCell,
    enableSorting: false,
  }),
  pxColumnHelper.accessor('text', {
    header: EntityHeader,
    cell: DisplayCell,
    meta: { headerClassName: 'w-5/6' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('_id', {
    header: ActionHeader,
    cell: props =>
      ViewButton(props, event => {
        event.preventDefault();
        console.log(`View action triggered for paragraph ID: ${props.cell.getValue()}`);
        // Add your custom event handling logic here
      }),
    enableSorting: false,
  }),
];

export { tableColumns, getTableColumns };
