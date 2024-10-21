/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Cell, CellContext, Row, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { EmbededButton } from 'V2/Components/UI/EmbededButton';
import {
  TableExtractor,
  TableSuggestion,
  SingleValueSuggestion,
  MultiValueSuggestion,
} from '../types';
import { Dot } from './Dot';
import { SuggestedValue } from './SuggestedValue';
import { propertyIcons } from './Icons';

const extractorColumnHelper = createColumnHelper<TableExtractor>();
const suggestionColumnHelper = createColumnHelper<TableSuggestion>();

const statusColor = (suggestion: TableSuggestion): Color => {
  if (!suggestion.isChild && (!suggestion.suggestedValue || suggestion.suggestedValue === '')) {
    return 'red';
  }

  if (suggestion.currentValue === suggestion.suggestedValue) {
    return 'green';
  }

  if (
    Array.isArray(suggestion.currentValue) &&
    Array.isArray(suggestion.suggestedValue) &&
    suggestion.currentValue.length === suggestion.suggestedValue.length &&
    suggestion.currentValue.every(
      value => Array.isArray(suggestion.suggestedValue) && suggestion.suggestedValue.includes(value)
    )
  ) {
    return 'green';
  }

  return 'orange';
};

const getIcon = (color: Color) => {
  switch (color) {
    case 'orange':
    case 'green':
      return <CheckCircleIcon />;
    case 'red':
      return <Dot color={color} />;
    default:
      return '';
  }
};

const ExtractorHeader = () => <Translate className="whitespace-nowrap">Extractor Name</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const TemplatesHeader = () => <Translate>Template(s)</Translate>;
const TitleHeader = () => <Translate>Document FOR</Translate>;
const CurrentValueHeader = () => (
  <Translate className="whitespace-nowrap">Current Value/Suggestion</Translate>
);
const AcceptHeader = () => <Translate className="sr-only">Accept</Translate>;
const SegmentHeader = () => <Translate>Context</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const PropertyCell = ({ cell }: CellContext<TableExtractor, TableExtractor['propertyType']>) => {
  const property = cell.getValue();
  return (
    <div className="flex items-center gap-2">
      <span className="w-5">{propertyIcons[property]}</span>
      <p className="text-gray-500 whitespace-nowrap">{cell.row.original.propertyLabel}</p>
    </div>
  );
};

const RenderParent = ({ suggestion }: { suggestion: MultiValueSuggestion }) => {
  const suggestions = suggestion.subRows;
  const ammountOfSuggestions = suggestions.length;
  const amountOfValues = suggestions.filter(s => s.currentValue).length;
  const amountOfMatches = suggestions.filter(s => s.currentValue === s.suggestedValue).length;
  const amountOfMissmatches = ammountOfSuggestions - amountOfMatches;

  return (
    <div className="flex gap-1 text-xs font-bold text-gray-500">
      <span>
        {amountOfValues} <Translate>values</Translate>
      </span>
      <span>|</span>
      <span>
        {ammountOfSuggestions} <Translate>suggestions</Translate>
      </span>
      {amountOfMatches > 0 && (
        <>
          <span>|</span>
          <span>
            <span className="text-green-500">{amountOfMatches}</span>{' '}
            <Translate>matching</Translate>
          </span>
        </>
      )}
      {amountOfMissmatches > 0 && (
        <>
          <span>|</span>
          <span>
            <span className="text-orange-500">{amountOfMissmatches}</span>{' '}
            <Translate>mismatching</Translate>
          </span>
        </>
      )}
    </div>
  );
};

const CurrentValueCell = ({
  cell,
  allProperties,
}: {
  cell: CellContext<
    TableSuggestion,
    SingleValueSuggestion['currentValue'] | MultiValueSuggestion['currentValue']
  >;
  allProperties: ClientPropertySchema[];
}) => {
  if (cell.row.original.state.obsolete) {
    return (
      <div className="flex gap-1 text-xs font-bold text-gray-500">
        <span>
          <Translate>Obsolete</Translate>
        </span>
      </div>
    );
  }

  if (cell.row.original.state.error) {
    return (
      <div className="flex gap-1 text-xs font-bold text-gray-500">
        <span>
          <Translate className="text-error-500">Error</Translate>
        </span>
      </div>
    );
  }

  if ('subRows' in cell.row.original) {
    return <RenderParent suggestion={cell.row.original as MultiValueSuggestion} />;
  }
  return (
    <SuggestedValue
      value={cell.getValue()}
      suggestion={cell.row.original as SingleValueSuggestion}
      templateProperties={allProperties}
    />
  );
};

const AcceptButton = ({
  cell,
  action,
}: {
  cell: Cell<TableSuggestion, string>;
  action: Function;
}) => {
  const color = statusColor(cell.row.original);
  const suggestionHasEntity = Boolean(cell.row.original.entityId);

  if (color === 'green') {
    return <div className="w-6 h-6 m-auto">{getIcon(color)}</div>;
  }

  return (
    <div className="m-auto">
      <EmbededButton
        icon={getIcon(color)}
        color={color}
        disabled={color === 'red' || !suggestionHasEntity}
        onClick={() => action && action([cell.row.original])}
      >
        <Translate>Accept</Translate>
      </EmbededButton>
    </div>
  );
};

const TemplatesCell = ({ cell }: CellContext<TableExtractor, TableExtractor['namedTemplates']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(templateName => (
      <div key={templateName} className="whitespace-nowrap">
        <Pill color="gray">{templateName}</Pill>
      </div>
    ))}
  </div>
);

const LinkButton = ({ cell }: CellContext<TableExtractor, TableExtractor['_id']>) => (
  <Link to={`suggestions/${cell.getValue()}`}>
    <Button className="leading-4" styling="outline">
      <Translate>Review</Translate>
    </Button>
  </Link>
);

const OpenPDFButton = ({
  cell,
  action,
}: {
  cell: Cell<TableSuggestion, string>;
  action: Function;
}) => {
  const suggestionHasEntity = Boolean(cell.row.original.entityId);

  return (
    <Button
      className="leading-4"
      styling="light"
      disabled={!suggestionHasEntity}
      onClick={() => action && action(cell.row.original)}
    >
      <Translate className="whitespace-nowrap">Open PDF</Translate>
    </Button>
  );
};

const TitleCell = ({ cell, row }: CellContext<TableSuggestion, TableSuggestion['fileId']>) => (
  <div className="text-sm font-normal text-primary-700">
    <a href={`/entity/${row.original.sharedId}`} target="_blank" rel="noreferrer">
      {cell.getValue()} ({row.original.language})
    </a>
  </div>
);

const SegmentCell = ({ cell, row }: CellContext<TableSuggestion, TableSuggestion['segment']>) => {
  const segment = cell.getValue();
  if (row.getCanExpand()) {
    return null;
  }
  if (segment === '') {
    return (
      <span className="text-xs font-normal text-orange-600">
        <Translate>No context</Translate>
      </span>
    );
  }
  return segment;
};

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
    meta: { headerClassName: 'sr-only' },
  }),
];

type Color = 'red' | 'green' | 'orange';

const suggestionsTableColumnsBuilder = (
  templates: ClientTemplateSchema[],
  acceptSuggestions: (suggestions: TableSuggestion[]) => void,
  openPdfSidepanel: (suggestion: TableSuggestion) => void
) => {
  const allProperties = [...(templates[0].commonProperties || []), ...templates[0].properties];

  return [
    suggestionColumnHelper.accessor('entityTitle', {
      header: TitleHeader,
      cell: TitleCell,
      meta: { headerClassName: 'w-1/4' },
    }),
    suggestionColumnHelper.accessor('segment', {
      header: SegmentHeader,
      cell: SegmentCell,
      meta: { headerClassName: 'w-1/4' },
    }),
    suggestionColumnHelper.accessor('currentValue', {
      header: CurrentValueHeader,
      cell: cell => <CurrentValueCell cell={cell} allProperties={allProperties} />,
      meta: { headerClassName: 'w-1/4' },
    }),
    suggestionColumnHelper.display({
      id: 'accept-actions',
      header: AcceptHeader,
      cell: ({ cell, row }: { row: Row<TableSuggestion>; cell: Cell<TableSuggestion, any> }) => {
        if (row.depth === 0) {
          return <AcceptButton action={acceptSuggestions} cell={cell} />;
        }
        return null;
      },
      meta: {
        headerClassName: 'w-2/12',
        contentClassName: 'text-center',
      },
    }),
    suggestionColumnHelper.display({
      id: 'open-pdf-actions',
      header: ActionHeader,
      cell: ({ cell, row }: { row: Row<TableSuggestion>; cell: Cell<TableSuggestion, any> }) =>
        row.depth === 0 ? (
          <OpenPDFButton action={openPdfSidepanel} cell={cell} />
        ) : (
          <AcceptButton action={acceptSuggestions} cell={cell} />
        ),
      meta: {
        headerClassName: 'w-2/12',
        contentClassName: 'text-center',
      },
    }),
  ];
};

export { extractorsTableColumns, suggestionsTableColumnsBuilder };
