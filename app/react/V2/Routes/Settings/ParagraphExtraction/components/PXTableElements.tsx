/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { PXTable } from '../types';
import { TableTitle } from './TableTitle';

const extractorColumnHelper = createColumnHelper<PXTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);

const TemplateFromHeader = () => (
  <TableHeaderContainer>
    <Translate>Template</Translate>
  </TableHeaderContainer>
);
const TemplateToHeader = () => (
  <TableHeaderContainer>
    <Translate>Target Template</Translate>
  </TableHeaderContainer>
);
const DocumentsHeader = () => (
  <TableHeaderContainer>
    <Translate>Documents</Translate>
  </TableHeaderContainer>
);
const GeneratedEntitiesHeader = () => (
  <TableHeaderContainer>
    <Translate>Generated Entities</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => (
  <TableHeaderContainer>
    <Translate>Action</Translate>
  </TableHeaderContainer>
);

const NumericCell = ({
  cell,
}: CellContext<PXTable, PXTable['documents'] | PXTable['generatedEntities']>) => (
  <span className="text-sm font-normal text-gray-500">{cell.getValue()}</span>
);

const TemplatesCell = ({ cell }: CellContext<PXTable, PXTable['templateTo']>) => (
  <div className="flex flex-wrap gap-2">
    <div className="whitespace-nowrap">
      <Pill color="gray">{cell.getValue()}</Pill>
    </div>
  </div>
);

const TemplateFromCell = ({ cell }: CellContext<PXTable, PXTable['originTemplateNames']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<PXTable, PXTable['_id']>) => (
  <Link to={`${cell.getValue()}/entities`}>
    <Button className="leading-4" styling="outline">
      <Translate>View</Translate>
    </Button>
  </Link>
);

const tableColumns = [
  extractorColumnHelper.accessor('originTemplateNames', {
    header: TemplateFromHeader,
    enableSorting: true,
    cell: TemplateFromCell,
  }),
  extractorColumnHelper.accessor('targetTemplateName', {
    header: TemplateToHeader,
    enableSorting: true,
    cell: TemplatesCell,
  }),
  extractorColumnHelper.accessor('documents', {
    header: DocumentsHeader,
    enableSorting: true,
    cell: NumericCell,
  }),
  extractorColumnHelper.accessor('generatedEntities', {
    header: GeneratedEntitiesHeader,
    enableSorting: true,
    cell: NumericCell,
  }),
  extractorColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: true,
    cell: LinkButton,
  }),
];

export { tableColumns, TableTitle };
