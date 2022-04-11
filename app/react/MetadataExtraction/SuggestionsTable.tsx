/* eslint-disable react/no-multi-comp */
import React from 'react';
import _ from 'lodash';
import {
  Column,
  FilterProps,
  Row,
  useFilters,
  usePagination,
  useRowSelect,
  useTable,
} from 'react-table';
import { t, Translate } from 'app/I18N';
import { propertyValueFormatter } from 'app/Metadata/helpers/formater';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { PropertySchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';

const suggestionsTable = (
  reviewedProperty: PropertySchema,
  suggestions: EntitySuggestionType[],
  totalPages: number,
  actionsCell: Function,
  segmentCell: Function
) => {
  const stateFilter = ({
    column: { filterValue, setFilter },
  }: FilterProps<EntitySuggestionType>) => (
    <select
      className={filterValue ? 'filtered' : ''}
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">{t('System', 'All', 'All', false)}</option>
      <option value={SuggestionState.labelMatch}>
        {t('System', SuggestionState.labelMatch, SuggestionState.labelMatch, false)}
      </option>
      <option value={SuggestionState.labelMismatch}>
        {t('System', SuggestionState.labelMismatch, SuggestionState.labelMismatch, false)}
      </option>
      <option value={SuggestionState.valueMatch}>
        {t('System', SuggestionState.valueMatch, SuggestionState.valueMatch, false)}
      </option>
      <option value={SuggestionState.valueMismatch}>
        {t('System', SuggestionState.valueMismatch, SuggestionState.valueMismatch, false)}
      </option>
      <option value={SuggestionState.empty}>
        {t('System', SuggestionState.empty, SuggestionState.empty, false)}
      </option>
      <option value={SuggestionState.obsolete}>
        {t('System', SuggestionState.obsolete, SuggestionState.obsolete, false)}
      </option>
    </select>
  );

  const formatValue = (value: PropertyValueSchema | undefined) => {
    if (!value) return '-';
    if (reviewedProperty.type === 'date' && _.isNumber(value)) {
      return propertyValueFormatter.date(value);
    }
    return value;
  };

  const currentValueCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.original;
    const currentValue = formatValue(suggestion.currentValue);
    return (
      <div>
        <span className="suggestion-label">
          <Translate>{reviewedProperty.label}</Translate>
        </span>
        <p className="current-value">{currentValue}</p>
      </div>
    );
  };

  const suggestionCell = ({ row }: { row: Row<EntitySuggestionType> }) => {
    const suggestion = row.original;
    const suggestedValue = formatValue(suggestion.suggestedValue);
    return (
      <div>
        <span className="suggestion-label">
          <Translate>Suggestion</Translate>
        </span>
        <p className="suggested-value">{suggestedValue}</p>
      </div>
    );
  };

  const columns: Column<EntitySuggestionType>[] = React.useMemo(
    () => [
      {
        id: 'suggestion',
        Header: () => <Translate>Suggestion</Translate>,
        Cell: suggestionCell,
        className: 'suggestion',
      },
      {
        id: 'action',
        Header: () => '',
        Cell: actionsCell,
        className: 'action',
      },
      {
        id: 'currentValue',
        Header: () => (
          <>
            <Translate>Property</Translate>
          </>
        ),
        Cell: currentValueCell,
        className: 'current',
      },
      {
        id: 'entityTitle',
        accessor: 'entityTitle' as const,
        Header: () => <Translate>Title</Translate>,
        className: 'title',
      },
      {
        accessor: 'segment' as const,
        Header: () => <Translate>Context</Translate>,
        className: reviewedProperty.label === 'Title' ? 'long-segment' : 'segment',
        Cell: segmentCell,
      },
      {
        accessor: 'language' as const,
        Header: () => <Translate>Language</Translate>,
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => (
          <Translate>{row.original.language}</Translate>
        ),
      },
      {
        accessor: 'state' as const,
        Header: () => <Translate>State</Translate>,
        Cell: ({ row }: { row: Row<EntitySuggestionType> }) => (
          <Translate>{row.original.state}</Translate>
        ),
        Filter: stateFilter,
        className: 'state',
      },
    ],
    []
  );
  const hiddenColumns = reviewedProperty.label === 'Title' ? ['entityTitle'] : [];

  return useTable(
    {
      columns,
      data: suggestions,
      manualPagination: true,
      manualFilters: true,
      initialState: {
        hiddenColumns,
        pageIndex: 0,
        pageSize: 100,
      },

      pageCount: totalPages,
      autoResetPage: false,
      autoResetFilters: false,
    },

    useFilters,
    usePagination,
    useRowSelect
  );
};

export { suggestionsTable };
