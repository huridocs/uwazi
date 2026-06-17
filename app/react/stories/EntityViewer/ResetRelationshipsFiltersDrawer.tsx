import { useEffect } from 'react';
import { useRelationshipsPanelFilters } from '#V2/Routes/Entity/Components/EntityScopedProvider.js';

const ResetRelationshipsFiltersDrawer = () => {
  const { setFiltersDrawerOpen } = useRelationshipsPanelFilters();

  useEffect(() => {
    setFiltersDrawerOpen(false);
    return () => setFiltersDrawerOpen(false);
  }, [setFiltersDrawerOpen]);

  return null;
};

export { ResetRelationshipsFiltersDrawer };
