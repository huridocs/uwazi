/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { PXEntityTable } from '../types';

const pxColumnHelper = createColumnHelper<PXEntityTable>();

const TableHeaderContainer = ({ children }: { children: React.ReactNode }) => (
  <span className="text-gray-500 font-semibold text-xs">{children}</span>
);
const TemplateHeader = () => (
  <TableHeaderContainer>
    <Translate>Template</Translate>
  </TableHeaderContainer>
);
const EntityHeader = () => (
  <TableHeaderContainer>
    <Translate>Entity</Translate>
  </TableHeaderContainer>
);
const DocumentHeader = () => (
  <TableHeaderContainer>
    <Translate>Document</Translate>
  </TableHeaderContainer>
);
const LanguageHeader = () => (
  <TableHeaderContainer>
    <Translate>Language</Translate>
  </TableHeaderContainer>
);
const ParagraphCountHeader = () => (
  <TableHeaderContainer>
    <Translate>Paragraphs</Translate>
  </TableHeaderContainer>
);
const ActionHeader = () => (
  <TableHeaderContainer>
    <Translate>Action</Translate>
  </TableHeaderContainer>
);

const DisplayCell = ({
  cell,
}: CellContext<
  PXEntityTable,
  PXEntityTable['title'] | PXEntityTable['document'] | PXEntityTable['paragraphCount']
>) => <span className="text-xs font-medium text-gray-900">{cell.getValue()}</span>;

const LanguagesCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['languages']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<PXEntityTable, PXEntityTable['_id']>) => (
  <Link to={`${cell.getValue()}/paragraphs`}>
    <Button className="leading-4" styling="outline">
      <Translate>View</Translate>
    </Button>
  </Link>
);

const TemplateCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['templateName']>) => (
  <div className="flex flex-wrap gap-2">
    <div className="whitespace-nowrap">
      <Pill color="gray">{cell.getValue()}</Pill>
    </div>
  </div>
);

const tableColumns = [
  pxColumnHelper.accessor('templateName', {
    header: TemplateHeader,
    enableSorting: true,
    cell: TemplateCell,
  }),
  pxColumnHelper.accessor('title', {
    header: EntityHeader,
    enableSorting: true,
    cell: DisplayCell,
  }),
  pxColumnHelper.accessor('document', {
    header: DocumentHeader,
    enableSorting: true,
    cell: DisplayCell,
  }),
  pxColumnHelper.accessor('languages', {
    header: LanguageHeader,
    enableSorting: true,
    cell: LanguagesCell,
  }),
  pxColumnHelper.accessor('paragraphCount', {
    header: ParagraphCountHeader,
    enableSorting: true,
    cell: DisplayCell,
  }),
  pxColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: true,
    cell: LinkButton,
  }),
];

export { tableColumns };
