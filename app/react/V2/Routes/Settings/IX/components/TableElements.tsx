/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { CalculatorIcon, CalendarDaysIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'app/V2/Components/UI';
import { Extractor } from '../types';
import { EntitySuggestionType } from 'shared/types/suggestionType';

const propertyIcons = {
  text: <Bars3BottomLeftIcon className="w-5" />,
  numeric: <CalculatorIcon className="w-5" />,
  date: <CalendarDaysIcon className="w-5" />,
};

const extractorColumnHelper = createColumnHelper<Extractor>();
const suggestionColumnHelper = createColumnHelper<EntitySuggestionType>();

const ExtractorHeader = () => <Translate className="whitespace-nowrap">Extractor Name</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const TemplatesHeader = () => <Translate>Template(s)</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const PropertyCell = ({ cell }: CellContext<Extractor, Extractor['propertyType']>) => {
  const property = cell.getValue();
  return (
    <div className="flex flex-wrap gap-2">
      {propertyIcons[property]}
      <p className="text-gray-500">{cell.row.original.propertyLabel}</p>
    </div>
  );
};

const TemplatesCell = ({ cell }: CellContext<Extractor, Extractor['namedTemplates']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(templateName => (
      <div key={templateName} className="whitespace-nowrap">
        <Pill color="gray">{templateName}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<Extractor, Extractor['_id']>) => (
  <Link to={`suggestions/${cell.getValue()}`}>
    <Button className="leading-4" styling="outline">
      <Translate>Review</Translate>
    </Button>
  </Link>
);

const OpenPDFButton = () => (
  <Button className="leading-4" styling="outline">
    <Translate>Open PDF</Translate>
  </Button>
);

const AcceptButton = () => (
  <Button className="leading-4" styling="outline">
    <Translate>Open PDF</Translate>
  </Button>
);

const extractorsTableColumns = [
  extractorColumnHelper.accessor('name', {
    header: ExtractorHeader,
    meta: { className: 'w-1/6' },
  }),
  extractorColumnHelper.accessor('propertyType', {
    header: PropertyHeader,
    cell: PropertyCell,
    meta: { className: 'w-1/6' },
  }),
  extractorColumnHelper.accessor('namedTemplates', {
    header: TemplatesHeader,
    enableSorting: false,
    cell: TemplatesCell,
    meta: { className: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: LinkButton,
    meta: { className: 'w-0 text-center' },
  }),
];

const suggestionsTableColumns = [
  suggestionColumnHelper.accessor('fileId', {
    header: () => <Translate>Document</Translate>,
    cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['fileId']>) =>
      cell.getValue(),
    meta: { className: 'w-1/6' },
  }),
  suggestionColumnHelper.accessor('segment', {
    header: () => <Translate>Context</Translate>,
    cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>) =>
      cell.getValue(),
    meta: { className: 'w-1/6' },
  }),
  suggestionColumnHelper.accessor('currentValue', {
    header: () => <Translate>Current Value/Suggestion</Translate>,
    cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>) =>
      cell.getValue(),
    meta: { className: 'w-4/6' },
  }),
  suggestionColumnHelper.accessor('_id', {
    header: () => <Translate>Accept</Translate>,
    enableSorting: false,
    cell: () => <p>Toggle input</p>,
    meta: { className: 'w-1/6 text-center' },
  }),
  suggestionColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: OpenPDFButton,
    meta: { className: 'w-1/6 text-center' },
  }),
];

export type { Extractor };
export { extractorsTableColumns, suggestionsTableColumns };
