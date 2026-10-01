import { useCallback, useEffect, useState } from 'react';

const useLibraryMobilePane = (
  selectedId: string | undefined,
  creating: boolean,
  isMobile: boolean
) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number }>();
  const requestPane = useCallback((index: number) => {
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  }, []);
  const entityPane = isMobile && filtersOpen ? 2 : 1;
  useEffect(() => {
    if (selectedId || creating) requestPane(entityPane);
  }, [creating, entityPane, requestPane, selectedId]);
  const openFilters = useCallback(() => {
    setFiltersOpen(true);
    requestPane(1);
  }, [requestPane]);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  return { requestedPane, requestPane, filtersOpen, entityPane, openFilters, closeFilters };
};

export { useLibraryMobilePane };
