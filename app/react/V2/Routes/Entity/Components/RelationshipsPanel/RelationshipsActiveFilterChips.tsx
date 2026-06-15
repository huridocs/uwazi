import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { ActiveFilterChip } from '#V2/Components/UI/ActiveFilterChip.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  relationshipsPanelActiveClusterRefIdsAtom,
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelRelTypeFiltersAtom,
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
} from './relationshipsPanelFiltersAtom.js';

const RelationshipsActiveFilterChips = () => {
  const [search, setSearch] = useAtom(relationshipsPanelSearchAtom);
  const [sort, setSort] = useAtom(relationshipsPanelSortAtom);
  const [relTypeFilters, setRelTypeFilters] = useAtom(relationshipsPanelRelTypeFiltersAtom);
  const [entityTypeFilters, setEntityTypeFilters] = useAtom(
    relationshipsPanelEntityTypeFiltersAtom
  );
  const [cluster, setCluster] = useAtom(relationshipsPanelActiveClusterRefIdsAtom);
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
          removeAriaLabel="Clear search"
        />
      )}
      {sort === 'asc' && (
        <ActiveFilterChip
          label="A → Z"
          onRemove={() => setSort('none')}
          removeAriaLabel="Clear sort"
        />
      )}
      {sort === 'desc' && (
        <ActiveFilterChip
          label="Z → A"
          onRemove={() => setSort('none')}
          removeAriaLabel="Clear sort"
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
          removeAriaLabel="Clear selection filter"
        />
      )}
    </>
  );
};

export { RelationshipsActiveFilterChips };
