/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  TextPropertyIcon,
} from 'V2/Components/CustomIcons';
import { EmbededButton } from 'V2/Components/UI/EmbededButton';
import { Extractor } from '../types';
import { Dot } from './Dot';
import { SuggestedValue } from './SuggestedValue';

const propertyIcons = {
  text: <TextPropertyIcon className="w-4" />,
  date: <DatePropertyIcon className="w-4" />,
  numeric: <NumericPropertyIcon className="w-4" />,
  markdown: <MarkdownPropertyIcon className="w-4" />,
};

const extractorColumnHelper = createColumnHelper<Extractor>();
// Helper typed as any because of https://github.com/TanStack/table/issues/4224
const suggestionColumnHelper = createColumnHelper<any>();

const statusColor = (suggestion: EntitySuggestionType): Color => {
  if (!suggestion.suggestedValue || suggestion.suggestedValue === '') {
    return 'red';
  }
  if (suggestion.currentValue === suggestion.suggestedValue) {
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
const TitleHeader = () => <Translate>Document</Translate>;
const CurrentValueHeader = () => <Translate>Current Value/Suggestion</Translate>;
const AcceptHeader = () => <Translate>Accept</Translate>;
const SegmentHeader = () => <Translate>Context</Translate>;

const PropertyCell = ({ cell }: CellContext<Extractor, Extractor['propertyType']>) => {
  const property = cell.getValue();
  return (
    <div className="flex gap-2">
      {propertyIcons[property]}
      <p className="text-gray-500 whitespace-nowrap">{cell.row.original.propertyLabel}</p>
    </div>
  );
};

const CurrentValueCell = ({
  cell,
  allProperties,
}: {
  cell: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>;
  allProperties: ClientPropertySchema[];
}) => (
  <SuggestedValue
    value={cell.getValue()}
    suggestion={cell.row.original}
    templateProperties={allProperties}
  />
);

const AcceptButton = ({ cell }: CellContext<EntitySuggestionType, unknown>) => {
  const color = statusColor(cell.row.original);
  const action = cell.column.columnDef.meta?.action;
  const suggestionHasEntity = Boolean(cell.row.original.entityId);

  return (
    <div className="flex items-center justify-center gap-1">
      <EmbededButton
        icon={getIcon(color)}
        color={color}
        disabled={color === 'green' || color === 'red' || !suggestionHasEntity}
        collapsed={color === 'green'}
        onClick={() => action && action([cell.row.original])}
      >
        <Translate>Accept</Translate>
      </EmbededButton>
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

const OpenPDFButton = ({ cell }: CellContext<EntitySuggestionType, unknown>) => {
  const action = cell.column.columnDef.meta?.action;
  const suggestionHasEntity = Boolean(cell.row.original.entityId);

  return (
    <Button
      className="leading-4"
      styling="outline"
      disabled={!suggestionHasEntity}
      onClick={() => action && action(cell.row.original)}
    >
      <Translate>Open PDF</Translate>
    </Button>
  );
};

const TitleCell = ({ cell }: CellContext<EntitySuggestionType, EntitySuggestionType['fileId']>) => (
  <div className="text-xs font-normal text-gray-900">{cell.getValue()}</div>
);

const SegmentCell = ({
  cell,
}: CellContext<EntitySuggestionType, EntitySuggestionType['segment']>) => {
  const segment = cell.getValue();
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
    header: () => '',
    enableSorting: false,
    cell: LinkButton,
    meta: { headerClassName: 'sr-only' },
  }),
];

type Color = 'red' | 'green' | 'orange';

const suggestionsTableColumnsBuilder: Function = (
  templates: ClientTemplateSchema[],
  acceptSuggestions: (suggestions: EntitySuggestionType[]) => void,
  openPdfSidepanel: (suggestion: EntitySuggestionType) => void
) => {
  const allProperties = [...(templates[0].commonProperties || []), ...templates[0].properties];

  return [
    suggestionColumnHelper.accessor('entityTitle', {
      header: TitleHeader,
      cell: TitleCell,
      meta: { headerClassName: 'w-3/12' },
    }) as ColumnDef<EntitySuggestionType, 'entityTitle'>,
    suggestionColumnHelper.accessor('segment', {
      header: SegmentHeader,
      cell: SegmentCell,
      meta: { headerClassName: 'w-3/12' },
    }) as ColumnDef<EntitySuggestionType, 'segment'>,
    suggestionColumnHelper.accessor('currentValue', {
      header: CurrentValueHeader,
      cell: cell => <CurrentValueCell cell={cell} allProperties={allProperties} />,
      meta: { headerClassName: 'w-3/12' },
    }) as ColumnDef<EntitySuggestionType, 'currentValue'>,
    suggestionColumnHelper.display({
      id: 'accept-actions',
      header: AcceptHeader,
      cell: AcceptButton,
      meta: {
        action: acceptSuggestions,
        headerClassName: 'w-1/12 text-center',
        contentClassName: 'text-center',
      },
    }),
    suggestionColumnHelper.display({
      id: 'open-pdf-actions',
      header: () => '',
      cell: OpenPDFButton,
      meta: {
        headerClassName: 'hidden',
        contentClassName: 'text-center',
        action: openPdfSidepanel,
      },
    }),
  ];
};

export type { Extractor };
export { extractorsTableColumns, suggestionsTableColumnsBuilder };
