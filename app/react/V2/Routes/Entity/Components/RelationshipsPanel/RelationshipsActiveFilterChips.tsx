import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  relationshipsPanelActiveClusterRefIdsAtom,
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelRelTypeFiltersAtom,
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
} from './relationshipsPanelFiltersAtom.js';

const chipClass =
  'inline-flex h-6 max-w-[160px] items-center gap-1 truncate rounded border border-border/60 bg-[color-mix(in_srgb,var(--color-theme-ink)_6%,var(--color-theme-bg-surface))] pl-1.5 pr-1 text-[11px] font-medium text-ink-secondary';

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

  return (
    <>
      {search.trim() && (
        <span className={chipClass}>
          <span className="truncate">{`"${search}"`}</span>
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
          >
            <XMarkIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      )}
      {sort === 'asc' && (
        <span className={chipClass}>
          <span>A → Z</span>
          <button
            type="button"
            onClick={() => setSort('none')}
            aria-label="Clear sort"
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
          >
            <XMarkIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      )}
      {sort === 'desc' && (
        <span className={chipClass}>
          <span>Z → A</span>
          <button
            type="button"
            onClick={() => setSort('none')}
            aria-label="Clear sort"
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
          >
            <XMarkIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      )}
      {activeRelTypes.map(id => (
        <span key={`rel-${id}`} className={chipClass}>
          <span className="truncate">
            {relationshipTypes.find(type => type._id === id)?.name ?? id}
          </span>
          <button
            type="button"
            onClick={() =>
              setRelTypeFilters(current => {
                const next = { ...current };
                delete next[id];
                return next;
              })
            }
            aria-label="Remove filter"
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
          >
            <XMarkIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {activeEntityTypes.map(id => {
        const template = templates.find(item => item._id === id);
        const isNoLabel = id === 'unknown';
        return (
          <span key={`ent-${id}`} className={chipClass}>
            {template?.color && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: template.color }}
              />
            )}
            <span className="truncate">{isNoLabel ? 'No label' : (template?.name ?? id)}</span>
            <button
              type="button"
              onClick={() =>
                setEntityTypeFilters(current => {
                  const next = { ...current };
                  delete next[id];
                  return next;
                })
              }
              aria-label="Remove filter"
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
            >
              <XMarkIcon className="h-2.5 w-2.5" />
            </button>
          </span>
        );
      })}
      {cluster && (
        <span className={chipClass}>
          <span>
            <Translate>From selection</Translate>
          </span>
          <button
            type="button"
            onClick={() => setCluster(null)}
            aria-label="Clear selection filter"
            className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-tertiary hover:text-ink"
          >
            <XMarkIcon className="h-2.5 w-2.5" />
          </button>
        </span>
      )}
    </>
  );
};

export { RelationshipsActiveFilterChips };
