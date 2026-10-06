import React from 'react';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { ActiveFilterChip } from '#V2/Components/UI/ActiveFilterChip.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  DEFAULT_RELATIONSHIPS_SORT,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelSearch,
  useRelationshipsPanelSort,
} from '#V2/Routes/Entity/Components/context/index.js';
import { sortOptionLabel } from '../utils/relationshipsPanelLabels.js';

const RelationshipsActiveFilterChips = () => {
  const { search, setSearch } = useRelationshipsPanelSearch();
  const { sort, setSort } = useRelationshipsPanelSort();
  const {
    relTypeFilters,
    setRelTypeFilters,
    entityTypeFilters,
    setEntityTypeFilters,
    activeClusterRefIds: cluster,
    setActiveClusterRefIds: setCluster,
  } = useRelationshipsPanelFacetFilters();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);

  const activeRelTypes = Object.entries(relTypeFilters)
    .filter(([, active]) => active)
    .map(([id]) => id);
  const activeEntityTypes = Object.entries(entityTypeFilters)
    .filter(([, active]) => active)
    .map(([id]) => id);

  const removeRelType = (id: string) =>
    setRelTypeFilters(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });

  const removeEntityType = (id: string) =>
    setEntityTypeFilters(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });

  return (
    <>
      {search.trim() && (
        <ActiveFilterChip
          label={`"${search}"`}
          onRemove={() => setSearch('')}
          removeAriaLabel={t('System', 'Clear search', null, false)}
        />
      )}
      {sort === 'asc' && (
        <ActiveFilterChip
          label={sortOptionLabel('asc')}
          onRemove={() => setSort(DEFAULT_RELATIONSHIPS_SORT)}
          removeAriaLabel={t('System', 'Clear sort', null, false)}
        />
      )}
      {sort === 'desc' && (
        <ActiveFilterChip
          label={sortOptionLabel('desc')}
          onRemove={() => setSort(DEFAULT_RELATIONSHIPS_SORT)}
          removeAriaLabel={t('System', 'Clear sort', null, false)}
        />
      )}
      {activeRelTypes.map(id => (
        <ActiveFilterChip
          key={`rel-${id}`}
          label={relationshipTypes.find(type => type._id === id)?.name ?? id}
          onRemove={() => removeRelType(id)}
        />
      ))}
      {activeEntityTypes.map(id => {
        const template = templates.find(item => item._id === id);
        const isNoLabel = id === 'unknown';
        return (
          <ActiveFilterChip
            key={`ent-${id}`}
            label={isNoLabel ? 'No label' : (template?.name ?? id)}
            color={template?.color}
            onRemove={() => removeEntityType(id)}
          />
        );
      })}
      {cluster && (
        <ActiveFilterChip
          label={<Translate>From selection</Translate>}
          onRemove={() => setCluster(null)}
          removeAriaLabel={t('System', 'Clear selection filter', null, false)}
        />
      )}
    </>
  );
};

export { RelationshipsActiveFilterChips };
