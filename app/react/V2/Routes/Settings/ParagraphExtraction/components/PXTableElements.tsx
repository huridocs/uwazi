/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { PXTable } from '../types';
import { TableTitle } from './TableTitle';
import { DisplayPill } from './DisplayPills';

const extractorColumnHelper = createColumnHelper<PXTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);

const SourceTemplateHeader = () => (
  <TableHeaderContainer>
    <Translate>Source Template</Translate>
  </TableHeaderContainer>
);
const TargetTemplateHeader = () => (
  <TableHeaderContainer>
    <Translate>Target Template</Translate>
  </TableHeaderContainer>
);
const EntitiesCountHeader = () => (
  <TableHeaderContainer>
    <Translate>Entities</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => <TableHeaderContainer> </TableHeaderContainer>;

const NewEntitiesCountPill = ({ count }: { count: number }) => (
  <Pill color="indigo" className="font-medium px-1 rounded-md text-xs">
    {count} <Translate>New</Translate>
  </Pill>
);

const NumericCell = ({ cell }: CellContext<PXTable, PXTable['count']>) => {
  const count = cell.getValue();
  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm font-normal text-gray-500">{count.generatedEntities}</span>
      {count.new > 0 && <NewEntitiesCountPill count={count.new} />}
    </div>
  );
};

const TemplatesCell = ({
  cell,
}: CellContext<PXTable, PXTable['targetTemplate'] | PXTable['sourceTemplate']>) => (
  <div className="flex flex-wrap gap-2">
    <div className="whitespace-nowrap">
      <DisplayPill color={cell.getValue().color}>
        <span className="text-xs font-medium">{cell.getValue().name}</span>
      </DisplayPill>
    </div>
  </div>
);

const ActionButtons = ({ cell }: CellContext<PXTable, PXTable['_id']>) => (
  <div className="flex gap-2 justify-end">
    <Link to={`${cell.getValue()}/entities`}>
      <Button className="leading-4" styling="outline">
        <Translate>View</Translate>
      </Button>
    </Link>
  </div>
);

const tableColumns = [
  extractorColumnHelper.accessor('sourceTemplate', {
    header: SourceTemplateHeader,
    enableSorting: true,
    cell: TemplatesCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('targetTemplate', {
    header: TargetTemplateHeader,
    enableSorting: true,
    cell: TemplatesCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('count', {
    header: EntitiesCountHeader,
    enableSorting: true,
    cell: NumericCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: ActionButtons,
  }),
];

const NoDataMessage = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Translate className="text-gray-500 font-semibold text-xs">NO EXTRACTORS</Translate>.
  </div>
);

export { tableColumns, TableTitle, NoDataMessage, NewEntitiesCountPill };
