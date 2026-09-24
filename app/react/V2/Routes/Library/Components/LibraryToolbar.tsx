/* eslint-disable react/no-multi-comp */
import React from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
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
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  type ThumbFrame,
  type ThumbSize,
} from './libraryCardDisplay.js';
import { LibraryCardsDisplayOptions } from './LibraryCardsDisplayOptions.js';
import { effectiveLibrarySort, librarySortOptions, nextLibrarySort } from './librarySort.js';
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
  thumbFrame?: ThumbFrame;
  onThumbFrameChange?: (value: ThumbFrame) => void;
  thumbSize?: ThumbSize;
  onThumbSizeChange?: (value: ThumbSize) => void;
  tableColumns?: LibraryTableColumnDef[];
  tableColumnGroups?: LibraryTableColumnGroup[];
  tableDisplay?: LibraryTableDisplayState;
  onToggleTableColumn?: (id: string) => void;
  onTableDensityChange?: (density: LibraryTableDensity) => void;
};

const SORT_DIRECTION_ICON = 'h-3 w-3 shrink-0 text-ink-tertiary';

const sortDirectionArrow = (order: LibrarySortOrder) =>
  order === 'asc' ? (
    <ArrowUpIcon className={SORT_DIRECTION_ICON} aria-hidden data-testid="sort-direction-asc" />
  ) : (
    <ArrowDownIcon className={SORT_DIRECTION_ICON} aria-hidden data-testid="sort-direction-desc" />
  );

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
  thumbFrame = DEFAULT_THUMB_FRAME,
  onThumbFrameChange,
  thumbSize = DEFAULT_THUMB_SIZE,
  onThumbSizeChange,
  tableColumns = [],
  tableColumnGroups,
  tableDisplay = DEFAULT_LIBRARY_TABLE_DISPLAY,
  onToggleTableColumn,
  onTableDensityChange,
}: LibraryToolbarProps) => {
  const locale = useAtomValue(localeAtom) || 'en';
  const sortValue = effectiveLibrarySort(sort);
  const sortSelectOptions = librarySortOptions(tableColumns, search, sortValue).map(option => ({
    value: option.value,
    label: t(option.translationContext, option.label, null, false),
    accessory: option.value === sortValue ? sortDirectionArrow(order) : undefined,
  }));
  const displayModified =
    view === 'table'
      ? tableDisplayModified(tableColumns, tableDisplay)
      : !showThumbnail ||
        !showMetadata ||
        (showThumbnail && (thumbFrame !== DEFAULT_THUMB_FRAME || thumbSize !== DEFAULT_THUMB_SIZE));

  return (
    <div className="flex shrink-0 items-center gap-8 border-b border-border bg-parchment px-3 py-2">
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
        rightSlot={
          <span
            data-testid="library-entity-count"
            className="shrink-0 text-nano tabular-nums text-ink-tertiary"
          >
            {totalRows.toLocaleString(locale)} <Translate>entities</Translate>
          </span>
        }
      />
      <div data-testid="library-toolbar-controls" className="flex shrink-0 items-center gap-2">
        <WarmSelect
          ariaLabel={t('System', 'Sort', null, false)}
          variant="paper"
          value={sortValue}
          options={sortSelectOptions}
          onChange={value => {
            const next = nextLibrarySort(sort, order, value);
            onSortChange(next.sort, next.order);
          }}
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
              thumbFrame={thumbFrame}
              onThumbFrameChange={onThumbFrameChange}
              thumbSize={thumbSize}
              onThumbSizeChange={onThumbSizeChange}
            />
          )}
        </DisplayMenu>
      </div>
    </div>
  );
};

export type { LibraryToolbarProps };
export { LibraryToolbar, LibraryTableDisplayOptions, VIEW_OPTIONS };
