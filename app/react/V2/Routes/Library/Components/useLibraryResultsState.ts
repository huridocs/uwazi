import { useState } from 'react';
import type { LibraryResultView, MatchTypeFilters } from './libraryResultSnippets.js';

type ResultsLayout = 'grouped' | 'passages';

const ALL_TYPES: MatchTypeFilters = { title: true, properties: true, document: true };

const resetForSearch = (
  search: string,
  update: {
    setTrackedSearch: (value: string) => void;
    setActive: (value: MatchTypeFilters) => void;
    setCollapsedIds: (value: ReadonlySet<string>) => void;
    setPassagesFolded: (value: boolean) => void;
  }
) => {
  update.setTrackedSearch(search);
  update.setActive(ALL_TYPES);
  update.setCollapsedIds(new Set());
  update.setPassagesFolded(false);
};

const useLibraryResultsState = (search: string) => {
  const [layout, setLayout] = useState<ResultsLayout>('grouped');
  const [active, setActive] = useState<MatchTypeFilters>(ALL_TYPES);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [passagesFolded, setPassagesFolded] = useState(false);
  const [trackedSearch, setTrackedSearch] = useState(search);

  if (search !== trackedSearch) {
    resetForSearch(search, { setTrackedSearch, setActive, setCollapsedIds, setPassagesFolded });
  }

  return {
    layout,
    setLayout,
    active,
    setActive,
    collapsedIds,
    setCollapsedIds,
    passagesFolded,
    setPassagesFolded,
  };
};

const canFoldResults = ({
  layout,
  trimmed,
  viewCount,
  foldable,
  collapsedIds,
  passagesFolded,
}: {
  layout: ResultsLayout;
  trimmed: string;
  viewCount: number;
  foldable: LibraryResultView[];
  collapsedIds: ReadonlySet<string>;
  passagesFolded: boolean;
}) => {
  const live = Boolean(trimmed) && viewCount > 0;
  const groupedOpen = foldable.some(view => !collapsedIds.has(view.sharedId));
  const groupedClosed = foldable.some(view => collapsedIds.has(view.sharedId));
  return {
    canCollapse: live && (layout === 'passages' ? !passagesFolded : groupedOpen),
    canExpand: live && (layout === 'passages' ? passagesFolded : groupedClosed),
  };
};

export type { ResultsLayout };
export { canFoldResults, useLibraryResultsState };
