/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'app/V2/Components/UI';
import { Extractor } from '../types';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { Dot } from './Dot';
import { SuggestedValue } from './SuggestedValue';
import { ClientTemplateSchema } from 'app/istore';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  TextPropertyIcon,
} from 'app/V2/Components/CustomIcons';

const propertyIcons = {
  text: <TextPropertyIcon className="w-4" />,
  date: <DatePropertyIcon className="w-4" />,
  numeric: <NumericPropertyIcon className="w-4" />,
  markdown: <MarkdownPropertyIcon className="w-4" />,
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
    <div className="flex gap-2">
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

const extractorsTableColumns = [
  extractorColumnHelper.accessor('name', {
    header: ExtractorHeader,
    meta: { headerClassName: 'w-1/6' },
  }),
  extractorColumnHelper.accessor('propertyType', {
    header: PropertyHeader,
    cell: PropertyCell,
    meta: { headerClassName: 'w-1/6' },
  }),
  extractorColumnHelper.accessor('namedTemplates', {
    header: TemplatesHeader,
    enableSorting: false,
    cell: TemplatesCell,
    meta: { headerClassName: 'w-4/6' },
  }),
  extractorColumnHelper.accessor('_id', {
    header: ActionHeader,
    enableSorting: false,
    cell: LinkButton,
    meta: { headerClassName: 'w-0 text-center' },
  }),
];

type Color = 'red' | 'green' | 'yellow';

const statusColor = (suggestion: EntitySuggestionType): Color => {
  if (!suggestion.suggestedValue || suggestion.suggestedValue === '') {
    return 'red';
  }
  if (suggestion.currentValue === suggestion.suggestedValue) {
    return 'green';
  }
  return 'yellow';
};

const suggestionsTableColumnsBuilder: Function = (
  templates: ClientTemplateSchema[],
  acceptSuggestions: (suggestion: any) => void
) => {
  const allProperties = [...(templates[0].commonProperties || []), ...templates[0].properties];
  return [
    suggestionColumnHelper.accessor('entityTitle', {
      header: () => <Translate>Document</Translate>,
      cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['fileId']>) => {
        return <div className="text-xs font-normal text-gray-900">{cell.getValue()}</div>;
      },
      meta: { headerClassName: 'w-3/12' },
    }),
    suggestionColumnHelper.accessor('segment', {
      header: () => <Translate>Context</Translate>,
      cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>) => {
        const segment = cell.getValue();
        if (segment === '') {
          return (
            <span className="text-xs font-normal text-orange-500">
              <Translate>No context</Translate>
            </span>
          );
        }
        return segment;
      },
      meta: { headerClassName: 'w-3/12' },
    }),
    suggestionColumnHelper.accessor('currentValue', {
      header: () => <Translate>Current Value/Suggestion</Translate>,
      cell: ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>) => {
        return (
          <SuggestedValue
            value={cell.getValue()}
            suggestion={cell.row.original}
            templateProperties={allProperties}
          />
        );
      },
      meta: { headerClassName: 'w-3/12' },
    }),
    suggestionColumnHelper.display({
      id: 'accept-actions',
      header: () => <Translate>Accept</Translate>,
      cell: ({ cell }: CellContext<EntitySuggestionType, unknown>) => {
        const color = statusColor(cell.row.original);
        return (
          <div className="flex items-center justify-between">
            <Button
              styling="outline"
              className="orange-500"
              size="small"
              color={color === 'green' ? 'success' : 'primary'}
              disabled={color === 'green'}
              onClick={() => cell.column.columnDef.meta!.action!([cell.row.original])}
            >
              <Translate>Accept</Translate>
            </Button>
            <Dot color={color}></Dot>
          </div>
        );
      },
      meta: {
        action: acceptSuggestions,
        headerClassName: 'w-1/12 text-center',
        contentClassName: 'text-center',
      },
    }),
    suggestionColumnHelper.display({
      id: 'open-pdf-actions',
      header: () => <Translate>Actions</Translate>,
      cell: OpenPDFButton,
      meta: { headerClassName: 'w-2/12 text-center', contentClassName: 'text-center' },
    }),
  ];
};

export type { Extractor };
export { extractorsTableColumns, suggestionsTableColumnsBuilder };
