import React from 'react';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { Aggregations } from '#shared/types/aggregations.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import { FacetCard, FacetRow } from './FacetCard.js';

const HIDDEN_AGGREGATION_KEYS = new Set([
  '_types',
  '_published',
  'generatedToc',
  '_permissions.self',
  '_permissions.read',
  '_permissions.write',
]);

type LibraryFiltersProps = {
  aggregations: Aggregations;
  filters: LibraryFiltersState;
  onChange: (filters: LibraryFiltersState) => void;
};

const bucketCount = (aggregations: Aggregations, name: string, key: string) =>
  aggregations.all?.[name]?.buckets?.find(bucket => String(bucket.key) === key)?.filtered
    ?.doc_count ?? 0;

const toggleValue = (current: string[] | undefined, value: string): string[] => {
  const next = new Set(current ?? []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return [...next];
};

const LibraryFilters = ({ aggregations, filters, onChange }: LibraryFiltersProps) => {
  const templates = useAtomValue(templatesAtom);
  const typeIds = filters.type ?? [];
  const status = filters.status ?? [];
  const templateById = new Map(templates.map(template => [template._id, template]));

  const typeBuckets = aggregations.all?._types?.buckets ?? [];
  const propertyFacets = Object.entries(aggregations.all || {}).filter(
    ([key, value]) => !HIDDEN_AGGREGATION_KEYS.has(key) && value?.buckets?.length
  );

  const publishedCount = bucketCount(aggregations, '_published', 'true');
  const restrictedCount = bucketCount(aggregations, '_published', 'false');
  const showStatus = publishedCount + restrictedCount > 0;

  const activeCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0);

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
            <FacetCard>
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

        {typeBuckets.length > 0 && (
          <FacetCard>
            {typeBuckets.map(bucket => {
              const id = String(bucket.key);
              const template = templateById.get(id);
              return (
                <FacetRow
                  key={id}
                  checked={typeIds.includes(id)}
                  onToggle={() => setFilter('type', toggleValue(typeIds, id))}
                  label={
                    template ? <Translate context={template._id}>{template.name}</Translate> : id
                  }
                  count={bucket.filtered?.doc_count ?? 0}
                  bold
                />
              );
            })}
          </FacetCard>
        )}

        {propertyFacets.map(([name, aggregation]) => {
          const property = templates
            .flatMap(template => template.properties ?? [])
            .find(item => item.name === name);
          return (
            <FacetCard key={name}>
              <div className="px-2 pt-1 text-sm font-bold text-ink">
                {property ? (
                  <Translate context={property._id || property.name}>{property.label}</Translate>
                ) : (
                  name
                )}
              </div>
              {aggregation.buckets
                .filter(bucket => bucket.key !== 'missing')
                .map(bucket => {
                  const id = String(bucket.key);
                  return (
                    <FacetRow
                      key={id}
                      checked={(filters[name] ?? []).includes(id)}
                      onToggle={() => setFilter(name, toggleValue(filters[name], id))}
                      label={bucket.label || id}
                      count={bucket.filtered?.doc_count ?? 0}
                    />
                  );
                })}
            </FacetCard>
          );
        })}
      </div>

      <div className="flex h-12 shrink-0 items-center border-t border-border px-3.5">
        <button
          type="button"
          onClick={() => onChange({})}
          disabled={activeCount === 0}
          className="cursor-pointer rounded-md bg-paper px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:bg-paper"
        >
          <Translate>Clear</Translate>
        </button>
      </div>
    </div>
  );
};

export type { LibraryFiltersProps };
export { LibraryFilters };
