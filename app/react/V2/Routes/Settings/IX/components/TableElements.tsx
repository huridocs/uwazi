/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { useCallback, useState } from 'react';
import { Cell, CellContext, Row, createColumnHelper } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import { get } from 'lodash';
import { Link, useRevalidator } from 'react-router';
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { Button, Pill } from 'V2/Components/UI';
import { EmbededButton } from 'V2/Components/UI/EmbededButton';
import { ClientTemplateSchema } from 'V2/shared/types';
import { propertyIcons } from 'V2/Components/UI/Icons';
import { ClientPropertySchema } from 'app/istore';
import { Translate } from 'app/I18N';
import {
  TableExtractor,
  TableSuggestion,
  SingleValueSuggestion,
  MultiValueSuggestion,
  SuggestionValue,
} from '../types';
import { Dot } from './Dot';
import { SuggestedValue } from './SuggestedValue';
import { acceptedSuggestions } from './atoms';
import { ContextCell } from './ContextCell';
import { calculateOptimalProportions } from '../helpers/contextHelpers';

const extractorColumnHelper = createColumnHelper<TableExtractor>();
const suggestionColumnHelper = createColumnHelper<TableSuggestion>();

const statusColor = (suggestion: TableSuggestion): Color => {
  if (!suggestion.isChild && (!suggestion.suggestedValue || suggestion.suggestedValue === '')) {
    return 'red';
  }

  if (
    suggestion.currentValue === suggestion.suggestedValue ||
    suggestion.currentValue === get(suggestion.suggestedValue, 'id')
  ) {
    return 'green';
  }

  if (
    Array.isArray(suggestion.currentValue) &&
    Array.isArray(suggestion.suggestedValue) &&
    suggestion.currentValue.length === suggestion.suggestedValue.length &&
    (suggestion.currentValue as SuggestionValue[]).every(
      (value: SuggestionValue) =>
        suggestion.suggestedValue &&
        (suggestion.suggestedValue as SuggestionValue[]).some(
          (suggested: SuggestionValue) => suggested === value || value === get(suggested, 'id')
        )
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
      return <CheckCircleIcon className="text-green-500" />;
    case 'red':
      return <Dot color={color} />;
    default:
      return '';
  }
};

const ExtractorHeader = () => <Translate className="whitespace-nowrap">Extractor Name</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const SourceHeader = () => <Translate>Source</Translate>;
const TemplatesHeader = () => <Translate>Template(s)</Translate>;
const TitleHeader = () => <Translate>Name</Translate>;
const CurrentValueHeader = () => (
  <Translate className="whitespace-nowrap">Current Value/Suggestion</Translate>
);
const UsedForTrainingHeader = () => (
  <Translate className="whitespace-nowrap">Use for training</Translate>
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
  const ammountOfSuggestions = suggestions?.length || 0;
  const amountOfValues = suggestions?.filter(s => s.currentValue).length || 0;
  const amountOfMatches =
    suggestions?.filter(
      s =>
        s.currentValue === s.suggestedValue ||
        s.currentValue === get(s.suggestedValue, 'id') ||
        (get(s.currentValue, 'id') !== undefined &&
          get(s.currentValue, 'id') === get(s.suggestedValue, 'id'))
    ).length || 0;
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
  cell: CellContext<TableSuggestion, TableSuggestion['currentValue']>;
  allProperties: ClientPropertySchema[];
}) => {
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
  const [accepted, setAccepted] = useAtom(acceptedSuggestions);
  const { rowId } = cell.row.original;
  const isGreen = accepted?.has(rowId) || statusColor(cell.row.original) === 'green';
  const color = isGreen ? 'green' : statusColor(cell.row.original);

  const suggestionHasEntity = Boolean(cell.row.original.entityId);

  if (color === 'green') {
    return <div className="w-6 h-6 m-auto">{getIcon(color)}</div>;
  }

  const isDisabled =
    color === 'red' ||
    !suggestionHasEntity ||
    cell.row.original.state.obsolete ||
    cell.row.original.state.error;

  return (
    <div className="m-auto">
      <EmbededButton
        icon={getIcon(color)}
        color={color}
        disabled={isDisabled}
        onClick={async () => {
          setAccepted(prev => {
            const newSet = new Set(prev || []);
            newSet.add(rowId);
            return newSet;
          });
          return action && action([cell.row.original]);
        }}
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

const OpenSidepanelButton = ({
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
      <Translate className="whitespace-nowrap">Open</Translate>
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
  const suggestion = row.original;
  const segmentText = get(suggestion.suggestedValue, 'segment');
  const segment = segmentText || cell.getValue();
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
  return <ContextCell text={segment} />;
};

const UsedForTrainingCell = ({
  cell,
  row,
  action,
}: {
  cell: Cell<TableSuggestion, boolean | undefined>;
  row: Row<TableSuggestion>;
  action: (suggestions: string[], use: boolean) => Promise<void>;
}) => {
  const { state } = useRevalidator();
  const usedForTraining = cell.getValue();
  const [disabled, setDisabled] = useState(state === 'loading');

  const handleClick = useCallback(async () => {
    setDisabled(true);
    await action([cell.row.original._id], !usedForTraining);
  }, [action, cell.row.original._id, usedForTraining]);

  if (row.depth > 0) {
    return undefined;
  }

  return (
    <button
      className="w-full flex justify-center disabled:cursor-not-allowed"
      disabled={disabled}
      type="button"
      onClick={handleClick}
    >
      {usedForTraining ? (
        <>
          <CheckCircleIcon
            className={`w-6 h-6 ${disabled ? 'text-green-300' : 'text-green-500'}`}
          />
          <Translate className="sr-only">Remove from training set</Translate>
        </>
      ) : (
        <>
          <PlusCircleIcon
            className={`w-6 h-6 ${disabled ? 'text-primary-300' : 'text-primary-900'}`}
          />
          <Translate className="sr-only">Add to training set</Translate>
        </>
      )}
    </button>
  );
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
  extractorColumnHelper.accessor('source', {
    header: SourceHeader,
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

const suggestionsTableColumnsBuilder = ({
  templates,
  acceptSuggestions,
  openPdfSidepanel,
  markForTraining,
}: {
  templates: ClientTemplateSchema[];
  acceptSuggestions: (suggestions: TableSuggestion[]) => Promise<void>;
  openPdfSidepanel: (suggestion: TableSuggestion) => void;
  markForTraining: (suggestions: string[], use: boolean) => Promise<void>;
}) => {
  const allProperties = [
    ...(templates[0].commonProperties || []),
    ...(templates[0].properties || []),
  ];

  const { titleWidth, contextWidth, valueWidth } = calculateOptimalProportions([]);

  return [
    suggestionColumnHelper.accessor('entityTitle', {
      header: TitleHeader,
      cell: TitleCell,
      meta: { headerClassName: titleWidth },
    }),
    suggestionColumnHelper.accessor('segment', {
      header: SegmentHeader,
      cell: SegmentCell,
      meta: { headerClassName: contextWidth },
    }),
    suggestionColumnHelper.accessor('currentValue', {
      header: CurrentValueHeader,
      cell: cell => <CurrentValueCell cell={cell} allProperties={allProperties} />,
      meta: { headerClassName: valueWidth },
    }),
    suggestionColumnHelper.accessor('useForTraining', {
      header: UsedForTrainingHeader,
      cell: ({ cell, row }) => (
        <UsedForTrainingCell cell={cell} row={row} action={markForTraining} />
      ),
      meta: { headerClassName: valueWidth },
      enableSorting: false,
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
        headerClassName: 'w-0',
        contentClassName: 'text-center',
      },
    }),
    suggestionColumnHelper.display({
      id: 'open-pdf-actions',
      header: ActionHeader,
      cell: ({ cell, row }: { row: Row<TableSuggestion>; cell: Cell<TableSuggestion, any> }) =>
        row.depth === 0 ? (
          <OpenSidepanelButton action={openPdfSidepanel} cell={cell} />
        ) : (
          <AcceptButton action={acceptSuggestions} cell={cell} />
        ),
      meta: {
        headerClassName: 'w-0',
        contentClassName: 'text-center',
      },
    }),
  ];
};

export { extractorsTableColumns, suggestionsTableColumnsBuilder };
