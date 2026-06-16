import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { relationshipsPanelFiltersDrawerOpenAtom } from '#V2/Routes/Entity/Components/RelationshipsPanel/relationshipsPanelFiltersAtom.js';

const ResetRelationshipsFiltersDrawer = () => {
  const setFiltersOpen = useSetAtom(relationshipsPanelFiltersDrawerOpenAtom);

  useEffect(() => {
    setFiltersOpen(false);
    return () => setFiltersOpen(false);
  }, [setFiltersOpen]);

  return null;
};

export { ResetRelationshipsFiltersDrawer };
