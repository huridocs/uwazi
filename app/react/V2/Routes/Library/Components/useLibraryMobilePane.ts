import { useCallback, useEffect, useState } from 'react';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';

type SideSheet = 'filters' | 'results' | null;

const useSideSheet = (requestPane: (index: number) => void) => {
  const [side, setSide] = useState<SideSheet>(null);
  const openFilters = useCallback(() => {
    setSide('filters');
    requestPane(1);
  }, [requestPane]);
  const openResults = useCallback(() => {
    setSide('results');
    requestPane(1);
  }, [requestPane]);
  const closeFilters = useCallback(() => {
    setSide(current => (current === 'filters' ? null : current));
  }, []);
  const closeResults = useCallback(() => {
    setSide(current => (current === 'results' ? null : current));
  }, []);
  return {
    filtersOpen: side === 'filters',
    resultsOpen: side === 'results',
    openFilters,
    openResults,
    closeFilters,
    closeResults,
  };
};

const useLibraryMobilePane = (
  selectedId: string | undefined,
  creating: boolean,
  isMobile: boolean
) => {
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number }>();
  const requestPane = useCallback((index: number) => {
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  }, []);
  const side = useSideSheet(requestPane);
  const sideOpen = side.filtersOpen || side.resultsOpen;
  const entityPane = isMobile && sideOpen ? 2 : 1;
  useEffect(() => {
    if (selectedId || creating) requestPane(entityPane);
  }, [creating, entityPane, requestPane, selectedId]);
  return { requestedPane, requestPane, entityPane, ...side };
};

const useLibraryPaneRequest = (selectedIds: readonly string[], creating: boolean) => {
  const isMobile = useIsMobile() === true;
  const [selectedId] = selectedIds;
  const pane = useLibraryMobilePane(selectedId, creating, isMobile);
  return { isMobile, ...pane };
};

export { useLibraryMobilePane, useLibraryPaneRequest };
