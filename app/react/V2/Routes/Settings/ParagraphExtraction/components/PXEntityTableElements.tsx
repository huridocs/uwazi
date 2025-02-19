/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { PXEntityTable } from '../types';
import { PXEntityStatus } from './PXEntityStatus';

const pxColumnHelper = createColumnHelper<PXEntityTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);

const EntityHeader = () => (
  <TableHeaderContainer>
    <Translate>Entity</Translate>
  </TableHeaderContainer>
);
const LanguageHeader = () => (
  <TableHeaderContainer>
    <Translate>Language(s)</Translate>
  </TableHeaderContainer>
);
const ParagraphCountHeader = () => (
  <TableHeaderContainer>
    <Translate>Paragraphs</Translate>
  </TableHeaderContainer>
);
const StatusHeader = () => (
  <TableHeaderContainer>
    <Translate>Status</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => <TableHeaderContainer> </TableHeaderContainer>;

const DisplayCell = ({
  cell,
}: CellContext<
  PXEntityTable,
  PXEntityTable['title'] | PXEntityTable['document'] | PXEntityTable['paragraphCount']
>) => <span className="text-xs font-medium text-gray-900">{cell.getValue()}</span>;

const LanguagesCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['languages']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<PXEntityTable, PXEntityTable['_id']>) => (
  <div className="flex gap-2 justify-end">
    <Link to={`${cell.getValue()}/paragraphs`}>
      <Button className="leading-4" styling="outline">
        <Translate>View</Translate>
      </Button>
    </Link>
  </div>
);

const StatusCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['status']>) => (
  <div className="flex items-center gap-2">
    <PXEntityStatus status={cell.getValue()} />
  </div>
);

const tableColumns = [
  pxColumnHelper.accessor('title', {
    header: EntityHeader,
    enableSorting: true,
    cell: DisplayCell,
    meta: { headerClassName: 'w-4/12' },
  }),
  pxColumnHelper.accessor('languages', {
    header: LanguageHeader,
    enableSorting: true,
    cell: LanguagesCell,
    meta: { headerClassName: 'w-3/12' },
  }),
  pxColumnHelper.accessor('paragraphCount', {
    header: ParagraphCountHeader,
    enableSorting: true,
    cell: DisplayCell,
    meta: { headerClassName: 'w-2/12' },
  }),
  pxColumnHelper.accessor('status', {
    header: StatusHeader,
    enableSorting: true,
    cell: StatusCell,
    meta: { headerClassName: 'w-2/12' },
  }),
  pxColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: LinkButton,
    meta: { headerClassName: 'w-1/12' },
  }),
];

export { tableColumns };
