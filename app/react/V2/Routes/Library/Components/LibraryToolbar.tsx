/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate, t } from '#app/I18N/index.js';
import {
  DisplayMenu,
  DisplayMenuCheckRow,
  QuerySearchBar,
  WarmSelect,
} from '#V2/Components/UI/index.js';
import { SearchTipsContent } from '#V2/Routes/Entity/Components/search/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import type { LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';
import {
  columnMatchKey,
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  DEFAULT_VISIBLE_COLUMN_IDS,
  isColumnVisible,
  type LibraryTableColumnDef,
  type LibraryTableColumnGroup,
  type LibraryTableDensity,
  type LibraryTableDisplayState,
} from './libraryTableColumns.js';

type LibraryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  view: LibraryViewMode;
  onViewChange: (view: LibraryViewMode) => void;
  sort: string;
  order: LibrarySortOrder;
  onSortChange: (sort: string, order: LibrarySortOrder) => void;
  totalRows: number;
  showThumbnail: boolean;
  onShowThumbnailChange: (value: boolean) => void;
  showMetadata: boolean;
  onShowMetadataChange: (value: boolean) => void;
  tableColumns?: LibraryTableColumnDef[];
  tableColumnGroups?: LibraryTableColumnGroup[];
  tableDisplay?: LibraryTableDisplayState;
  onToggleTableColumn?: (id: string) => void;
  onTableDensityChange?: (density: LibraryTableDensity) => void;
};

const SORT_OPTIONS = [
  { value: 'title', label: t('System', 'Title', null, false) },
  { value: 'creationDate', label: t('System', 'Creation date', null, false) },
  { value: 'editDate', label: t('System', 'Edit date', null, false) },
  { value: '_score', label: t('System', 'Relevance', null, false) },
];

const VIEW_OPTIONS = [
  { value: 'cards', label: t('System', 'Cards', null, false) },
  { value: 'map', label: t('System', 'Map', null, false) },
  { value: 'table', label: t('System', 'Table', null, false) },
];

const tableDisplayModified = (
  columns: LibraryTableColumnDef[],
  display: LibraryTableDisplayState
) =>
  display.density !== DEFAULT_LIBRARY_TABLE_DISPLAY.density ||
  columns.some(
    column =>
      isColumnVisible(columnMatchKey(column), display) !== DEFAULT_VISIBLE_COLUMN_IDS.has(column.id)
  );

const LibraryTableColumnGroupList = ({
  group,
  display,
  onToggleColumn,
}: {
  group: LibraryTableColumnGroup;
  display: LibraryTableDisplayState;
  onToggleColumn?: (id: string) => void;
}) => (
  <div>
    {group.templateId ? (
      <div className="mt-1 flex items-center gap-1.5 border-b border-border-soft px-2 pb-1 pt-2">
        <TemplateLabel templateId={group.templateId} variant="tag" />
      </div>
    ) : null}
    {group.columns.map(column => (
      <DisplayMenuCheckRow
        key={`${group.id}:${column.id}`}
        label={
          column.translationContext ? (
            <Translate context={column.translationContext}>{column.label}</Translate>
          ) : (
            <Translate>{column.label}</Translate>
          )
        }
        checked={isColumnVisible(columnMatchKey(column), display)}
        onToggle={() => onToggleColumn?.(columnMatchKey(column))}
      />
    ))}
  </div>
);

const LibraryTableDisplayOptions = ({
  columns,
  groups,
  display,
  onToggleColumn,
  onDensityChange,
}: {
  columns: LibraryTableColumnDef[];
  groups?: LibraryTableColumnGroup[];
  display: LibraryTableDisplayState;
  onToggleColumn?: (id: string) => void;
  onDensityChange?: (density: LibraryTableDensity) => void;
}) => {
  const columnGroups = groups?.length ? groups : [{ id: 'builtins', columns }];
  return (
    <>
      <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
        <Translate>Columns</Translate>
      </p>
      <div className="max-h-[32rem] overflow-y-auto">
        {columnGroups.map(group => (
          <LibraryTableColumnGroupList
            key={group.id}
            group={group}
            display={display}
            onToggleColumn={onToggleColumn}
          />
        ))}
      </div>
      <div className="my-1 h-px border-t border-border-soft" />
      <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
        <Translate>Density</Translate>
      </p>
      <DisplayMenuCheckRow
        label={<Translate>Comfortable</Translate>}
        description={<Translate>Room around every row</Translate>}
        checked={display.density === 'comfortable'}
        onToggle={() => onDensityChange?.('comfortable')}
      />
      <DisplayMenuCheckRow
        label={<Translate>Compact</Translate>}
        description={<Translate>More rows per screen; same type size</Translate>}
        checked={display.density === 'compact'}
        onToggle={() => onDensityChange?.('compact')}
      />
    </>
  );
};

const LibraryCardsDisplayOptions = ({
  showThumbnail,
  showMetadata,
  onShowThumbnailChange,
  onShowMetadataChange,
}: {
  showThumbnail: boolean;
  showMetadata: boolean;
  onShowThumbnailChange: (value: boolean) => void;
  onShowMetadataChange: (value: boolean) => void;
}) => (
  <>
    <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
      <Translate>Show information</Translate>
    </p>
    <DisplayMenuCheckRow
      label={<Translate>Thumbnail</Translate>}
      checked={showThumbnail}
      onToggle={() => onShowThumbnailChange(!showThumbnail)}
    />
    <DisplayMenuCheckRow
      label={<Translate>Metadata</Translate>}
      checked={showMetadata}
      onToggle={() => onShowMetadataChange(!showMetadata)}
    />
  </>
);

const LibraryToolbar = ({
  search,
  onSearchChange,
  onSearchSubmit,
  view,
  onViewChange,
  sort,
  order,
  onSortChange,
  totalRows,
  showThumbnail,
  onShowThumbnailChange,
  showMetadata,
  onShowMetadataChange,
  tableColumns = [],
  tableColumnGroups,
  tableDisplay = DEFAULT_LIBRARY_TABLE_DISPLAY,
  onToggleTableColumn,
  onTableDensityChange,
}: LibraryToolbarProps) => {
  const sortValue = sort || 'creationDate';
  const displayModified =
    view === 'table'
      ? tableDisplayModified(tableColumns, tableDisplay)
      : !showThumbnail || !showMetadata;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-parchment px-3 py-2">
      <QuerySearchBar
        value={search}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
        placeholder={t('System', 'Search title & metadata', null, false)}
        ariaLabel={t('System', 'Search', null, false)}
        clearAriaLabel={t('System', 'Clear search', null, false)}
        tipsAriaLabel={t('System', 'Search tips', null, false)}
        tipsLabel={<Translate>tips</Translate>}
        tipsWidth={432}
        tipsContent={<SearchTipsContent onInsert={onSearchSubmit ?? onSearchChange} />}
        className="min-w-0 flex-1 pb-0 pt-0"
        boxClassName="bg-paper"
      />
      <span className="hidden shrink-0 text-nano tabular-nums text-ink-tertiary md:inline">
        {totalRows} <Translate>entities</Translate>
      </span>
      <WarmSelect
        ariaLabel={t('System', 'Sort', null, false)}
        variant="paper"
        value={sortValue}
        options={SORT_OPTIONS}
        onChange={value => onSortChange(value, order)}
      />
      <WarmSelect
        ariaLabel={t('System', 'View', null, false)}
        variant="paper"
        value={view}
        options={VIEW_OPTIONS}
        onChange={value => onViewChange(value as LibraryViewMode)}
      />
      <DisplayMenu
        ariaLabel={t('System', 'Display options', null, false)}
        appearance="outlined"
        modified={displayModified}
      >
        {view === 'table' ? (
          <LibraryTableDisplayOptions
            columns={tableColumns}
            groups={tableColumnGroups}
            display={tableDisplay}
            onToggleColumn={onToggleTableColumn}
            onDensityChange={onTableDensityChange}
          />
        ) : (
          <LibraryCardsDisplayOptions
            showThumbnail={showThumbnail}
            showMetadata={showMetadata}
            onShowThumbnailChange={onShowThumbnailChange}
            onShowMetadataChange={onShowMetadataChange}
          />
        )}
      </DisplayMenu>
    </div>
  );
};

export type { LibraryToolbarProps };
export { LibraryToolbar, LibraryTableDisplayOptions, VIEW_OPTIONS };
