/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { TableExtractor } from '../types';

const extractorColumnHelper = createColumnHelper<TableExtractor>();

const TemplateFromHeader = () => <Translate>Template</Translate>;
const TemplateToHeader = () => <Translate>Target Template</Translate>;
const DocumentsHeader = () => <Translate>Documents</Translate>;
const GeneratedEntitiesHeader = () => <Translate>Generated Entities</Translate>;
const ActionHeader = () => <Translate className="">Action</Translate>;

const NumericCell = ({
  cell,
}: CellContext<
  TableExtractor,
  TableExtractor['documents'] | TableExtractor['generatedEntities']
>) => <span className="text-sm font-normal text-gray-500">{cell.getValue()}</span>;

const TemplatesCell = ({ cell }: CellContext<TableExtractor, TableExtractor['templateTo']>) => (
  <div className="flex flex-wrap gap-2">
    <div key={cell.getValue()} className="whitespace-nowrap">
      <Pill color="gray">{cell.getValue()}</Pill>
    </div>
  </div>
);

const TemplateFromCell = ({
  cell,
}: CellContext<TableExtractor, TableExtractor['templateFrom']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<TableExtractor, TableExtractor['_id']>) => (
  <Link to={`suggestions/${cell.getValue()}`}>
    <Button className="leading-4" styling="outline">
      <Translate>View</Translate>
    </Button>
  </Link>
);

// todo: fix width of each column
const extractorsTableColumns = [
  extractorColumnHelper.accessor('originTemplateNames', {
    header: TemplateFromHeader,
    enableSorting: true,
    cell: TemplateFromCell,
    meta: { headerClassName: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('targetTemplateName', {
    header: TemplateToHeader,
    enableSorting: true,
    cell: TemplatesCell,
    meta: { headerClassName: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('documents', {
    header: DocumentsHeader,
    enableSorting: true,
    cell: NumericCell,
    meta: { headerClassName: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('generatedEntities', {
    header: GeneratedEntitiesHeader,
    enableSorting: true,
    cell: NumericCell,
    meta: { headerClassName: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: true,
    cell: LinkButton,
    meta: { headerClassName: '' },
  }),
];

export { extractorsTableColumns };
