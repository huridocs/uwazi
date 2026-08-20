import React, { type ReactNode } from 'react';
import { Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import {
  ActiveFilterChip,
  DisplayMenu,
  DisplayMenuRow,
  QuerySearchBar,
  SegmentedControl,
  WarmSelect,
} from '#V2/Components/UI/index.js';
import type { LibrarySortOrder, LibraryViewMode } from '../libraryUrlState.js';

type Chip = {
  key: string;
  label: ReactNode;
  onRemove: () => void;
};

type LibraryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  view: LibraryViewMode;
  onViewChange: (view: LibraryViewMode) => void;
  sort: string;
  order: LibrarySortOrder;
  onSortChange: (sort: string, order: LibrarySortOrder) => void;
  chips: Chip[];
  totalRows: number;
};

const SORT_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'creationDate', label: 'Date added' },
  { value: '_score', label: 'Relevance' },
];

const LibraryToolbar = ({
  search,
  onSearchChange,
  view,
  onViewChange,
  sort,
  order,
  onSortChange,
  chips,
  totalRows,
}: LibraryToolbarProps) => {
  const sortValue = sort || 'creationDate';

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <QuerySearchBar
          value={search}
          onChange={onSearchChange}
          placeholder='Search  •  AND, OR, NOT, "exact", wild*'
          ariaLabel="Search"
          clearAriaLabel="Clear search"
          className="min-w-0 flex-1 pb-0 pt-0"
          inlineSlot={chips.map(chip => (
            <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
        />
        <SegmentedControl
          ariaLabel="Library view"
          value={view}
          onChange={onViewChange}
          options={[
            { id: 'cards' as const, title: 'Cards', Icon: Squares2X2Icon },
            { id: 'list' as const, title: 'List', Icon: Bars3Icon },
          ]}
        />
        <DisplayMenu ariaLabel="Sort" size="sm">
          <DisplayMenuRow label={<Translate>Sort</Translate>}>
            <WarmSelect
              ariaLabel="Sort field"
              value={sortValue}
              options={SORT_OPTIONS}
              onChange={value => onSortChange(value, order)}
            />
          </DisplayMenuRow>
          <DisplayMenuRow label={<Translate>Order</Translate>}>
            <WarmSelect
              ariaLabel="Sort order"
              value={order}
              options={[
                { value: 'desc', label: 'Descending' },
                { value: 'asc', label: 'Ascending' },
              ]}
              onChange={value => onSortChange(sortValue, value as LibrarySortOrder)}
            />
          </DisplayMenuRow>
        </DisplayMenu>
      </div>
      <p className="text-micro text-ink-tertiary">
        <Translate>Showing</Translate> {totalRows} <Translate>entities</Translate>
      </p>
    </div>
  );
};

export type { Chip, LibraryToolbarProps };
export { LibraryToolbar };
