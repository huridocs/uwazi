import React, { useState } from 'react';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import { FacetCard, FacetRow } from './FacetCard.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { ActiveFiltersSheet, type Chip } from './ActiveFiltersSheet.js';

type LibraryFiltersProps = {
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  onChange: (filters: LibraryFiltersState) => void;
  chips?: Chip[];
};

const toggleValue = (current: string[] | undefined, value: string): string[] => {
  const next = new Set(current ?? []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return [...next];
};

const LibraryFilters = ({ aggregations, filters, onChange, chips = [] }: LibraryFiltersProps) => {
  const templates = useAtomValue(templatesAtom);
  const typeIds = filters.type ?? [];
  const status = filters.status ?? [];
  const templateById = new Map(templates.map(template => [template._id, template]));

  const publishedCount = aggregations.published.published;
  const restrictedCount = aggregations.published.restricted;
  const showStatus = publishedCount + restrictedCount > 0;
  const propertyFacets = Object.entries(aggregations.properties).filter(
    ([, buckets]) => buckets.length
  );

  const activeCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0);
  const facetIds = ['status', 'type', ...propertyFacets.map(([name]) => name)];
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => openFacets[id] !== false;
  const setAllFacets = (open: boolean) => {
    setOpenFacets(Object.fromEntries(facetIds.map(id => [id, open])));
  };

  const setFilter = (key: string, values: string[]) => {
    const next = { ...filters };
    if (values.length) {
      next[key] = values;
    } else {
      delete next[key];
    }
    onChange(next);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-warm">
      <div className="shrink-0 px-3.5 py-2">
        <span className="inline-flex h-7 items-center rounded-md bg-vellum px-3 text-[13px] font-semibold text-ink">
          <Translate>Filters</Translate>
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-auto px-3.5 pb-3">
        {showStatus && (
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <FacetCard title={<Translate>Status</Translate>} open={isOpen('status')}>
              <FacetRow
                checked={status.includes('restricted')}
                onToggle={() => setFilter('status', toggleValue(status, 'restricted'))}
                label={<Translate>Restricted</Translate>}
                icon={<LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
                count={restrictedCount}
                bold
              />
              <FacetRow
                checked={status.includes('published')}
                onToggle={() => setFilter('status', toggleValue(status, 'published'))}
                label={<Translate>Published</Translate>}
                icon={<GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
                count={publishedCount}
                bold
              />
            </FacetCard>
          </NeedAuthorization>
        )}

        {aggregations.templates.length > 0 && (
          <FacetCard title={<Translate>Type</Translate>} open={isOpen('type')}>
            {aggregations.templates.map(bucket => {
              const template = templateById.get(bucket.id);
              return (
                <FacetRow
                  key={bucket.id}
                  checked={typeIds.includes(bucket.id)}
                  onToggle={() => setFilter('type', toggleValue(typeIds, bucket.id))}
                  label={
                    template ? (
                      <Translate context={template._id}>{template.name}</Translate>
                    ) : (
                      bucket.id
                    )
                  }
                  count={bucket.count}
                  bold
                />
              );
            })}
          </FacetCard>
        )}

        {propertyFacets.map(([name, buckets]) => {
          const property = templates
            .flatMap(template => template.properties ?? [])
            .find(item => item.name === name);
          return (
            <FacetCard
              key={name}
              title={
                property ? (
                  <Translate context={property._id || property.name}>{property.label}</Translate>
                ) : (
                  name
                )
              }
              open={isOpen(name)}
            >
              {buckets.map(bucket => (
                <FacetRow
                  key={bucket.id}
                  checked={(filters[name] ?? []).includes(bucket.id)}
                  onToggle={() => setFilter(name, toggleValue(filters[name], bucket.id))}
                  label={bucket.label || bucket.id}
                  count={bucket.count}
                />
              ))}
            </FacetCard>
          );
        })}
      </div>

      <ActiveFiltersSheet chips={chips} onClearAll={() => onChange({})} />

      <div className="flex h-12 shrink-0 items-center gap-2 border-t border-border px-3.5">
        <LibraryFooterButton onClick={() => setAllFacets(false)}>
          <Translate>Collapse all</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton onClick={() => setAllFacets(true)}>
          <Translate>Expand all</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton
          className="ms-auto"
          onClick={() => onChange({})}
          disabled={activeCount === 0}
        >
          <Translate>Clear</Translate>
        </LibraryFooterButton>
      </div>
    </div>
  );
};

export type { LibraryFiltersProps };
export { LibraryFilters };
