/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Translate, t } from '#app/I18N/index.js';
import {
  DisplayMenu,
  DisplayMenuRow,
  QuerySearchBar,
  WarmSelect,
} from '#V2/Components/UI/index.js';
import { SearchTipsContent } from '#V2/Routes/Entity/Components/search/index.js';
import type { LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';

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
};

const SORT_OPTIONS = [
  { value: 'title', label: t('System', 'Title', null, false) },
  { value: 'creationDate', label: t('System', 'Date added', null, false) },
  { value: '_score', label: t('System', 'Relevance', null, false) },
];

const VIEW_OPTIONS = [
  { value: 'cards', label: t('System', 'Cards', null, false) },
  { value: 'list', label: t('System', 'List', null, false) },
  { value: 'map', label: t('System', 'Map', null, false) },
  { value: 'table', label: t('System', 'Table', null, false) },
  { value: 'timeline', label: t('System', 'Timeline', null, false) },
];

const DisplayCheckRow = ({
  label,
  checked,
  onToggle,
}: {
  label: React.ReactNode;
  checked: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={checked}
    onClick={onToggle}
    className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-start transition-colors hover:bg-warm"
  >
    <span className="flex w-4 shrink-0 items-center justify-center text-carbon">
      {checked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
    </span>
    <span className={`text-xs ${checked ? 'text-ink' : 'text-ink-tertiary'}`}>{label}</span>
  </button>
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
}: LibraryToolbarProps) => {
  const sortValue = sort || 'creationDate';
  const displayModified = !showThumbnail || !showMetadata || order !== 'desc';

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
        <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Sort</Translate>
        </p>
        <DisplayMenuRow label={<Translate>Order</Translate>}>
          <WarmSelect
            ariaLabel={t('System', 'Sort order', null, false)}
            value={order}
            options={[
              { value: 'desc', label: t('System', 'Descending', null, false) },
              { value: 'asc', label: t('System', 'Ascending', null, false) },
            ]}
            onChange={value => onSortChange(sortValue, value as LibrarySortOrder)}
          />
        </DisplayMenuRow>
        <div className="my-1 h-px border-t border-border-soft" />
        <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Show information</Translate>
        </p>
        <DisplayCheckRow
          label={<Translate>Thumbnail</Translate>}
          checked={showThumbnail}
          onToggle={() => onShowThumbnailChange(!showThumbnail)}
        />
        <DisplayCheckRow
          label={<Translate>Metadata</Translate>}
          checked={showMetadata}
          onToggle={() => onShowMetadataChange(!showMetadata)}
        />
      </DisplayMenu>
    </div>
  );
};

export type { LibraryToolbarProps };
export { LibraryToolbar };
