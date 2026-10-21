import { useEffect, useRef, useState } from 'react';

type PaneTab = 'filters' | 'results';

type ChromeInput = {
  search: string;
  committedSearch?: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  isMobile: boolean;
  closeResults: () => void;
  closeFilters: () => void;
  closePreview: () => void;
  openResults: () => void;
  clearSelection: () => void;
};

const syncPaneTab = (
  confirmedSearch: string,
  trackedSearch: string,
  update: {
    setTrackedSearch: (value: string) => void;
    setPaneTab: (value: PaneTab) => void;
  }
) => {
  if (confirmedSearch === trackedSearch) return;
  update.setTrackedSearch(confirmedSearch);
  update.setPaneTab(confirmedSearch ? 'results' : 'filters');
};

const revealResults = (update: {
  setResultsArmed: (value: boolean) => void;
  setPaneTab: (value: PaneTab) => void;
  closePreview: () => void;
  closeFilters: () => void;
  openResults: () => void;
}) => {
  update.setResultsArmed(false);
  update.setPaneTab('results');
  update.closePreview();
  update.closeFilters();
  update.openResults();
};

const openSubmittedResults = (
  value: string,
  ctx: {
    search: string;
    resultsArmed: boolean;
    setResultsArmed: (armed: boolean) => void;
    closeResults: () => void;
    setPaneTab: (value: PaneTab) => void;
    closePreview: () => void;
    closeFilters: () => void;
    openResults: () => void;
  }
) => {
  const trimmed = value.trim();
  if (!trimmed) {
    ctx.setResultsArmed(false);
    ctx.closeResults();
    return;
  }
  if (!ctx.resultsArmed && ctx.search.trim()) return;
  revealResults(ctx);
};

const resultsActions = (ctx: {
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  isMobile: boolean;
  search: string;
  resultsArmed: boolean;
  setResultsArmed: (armed: boolean) => void;
  closeResults: () => void;
  setPaneTab: (value: PaneTab) => void;
  closePreview: () => void;
  closeFilters: () => void;
  openResults: () => void;
  clearSelection: () => void;
}) => ({
  clearSearch: () => {
    ctx.onSearchChange('');
    ctx.onSearchSubmit?.('');
  },
  submitSearch: (value: string) => {
    ctx.onSearchSubmit?.(value);
    if (value.trim()) ctx.clearSelection();
    if (!ctx.isMobile) return;
    openSubmittedResults(value, ctx);
  },
  showResults: () => {
    ctx.setResultsArmed(false);
    ctx.setPaneTab('results');
    ctx.closeFilters();
    ctx.closePreview();
    if (ctx.isMobile) ctx.openResults();
  },
});

const useClearSelectionOnSearch = (confirmedSearch: string, clearSelection: () => void) => {
  const seenSearch = useRef(confirmedSearch);
  useEffect(() => {
    if (seenSearch.current === confirmedSearch) return;
    seenSearch.current = confirmedSearch;
    if (confirmedSearch) clearSelection();
  }, [clearSelection, confirmedSearch]);
};

const useLibraryResultsChrome = ({
  search,
  committedSearch,
  onSearchChange,
  onSearchSubmit,
  isMobile,
  closeResults,
  closeFilters,
  closePreview,
  openResults,
  clearSelection,
}: ChromeInput) => {
  const confirmedSearch = (committedSearch ?? search).trim();
  const [trackedSearch, setTrackedSearch] = useState(confirmedSearch);
  const [paneTab, setPaneTab] = useState<PaneTab>(confirmedSearch ? 'results' : 'filters');
  syncPaneTab(confirmedSearch, trackedSearch, { setTrackedSearch, setPaneTab });
  const [resultsArmed, setResultsArmed] = useState(false);
  const wasSearchActive = useRef(search.trim().length > 0);
  useEffect(() => {
    const active = search.trim().length > 0;
    if (isMobile && active && !wasSearchActive.current) setResultsArmed(true);
    if (!active) {
      setResultsArmed(false);
      closeResults();
    }
    wasSearchActive.current = active;
  }, [closeResults, isMobile, search]);
  useClearSelectionOnSearch(confirmedSearch, clearSelection);
  const actions = resultsActions({
    onSearchChange,
    onSearchSubmit,
    isMobile,
    search,
    resultsArmed,
    setResultsArmed,
    closeResults,
    setPaneTab,
    closePreview,
    closeFilters,
    openResults,
    clearSelection,
  });

  return { confirmedSearch, paneTab, setPaneTab, ...actions };
};

export { useLibraryResultsChrome };
