import React from 'react';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { localeAtom } from '#V2/atoms/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import { filterableProperties } from '../filterableProperties.js';
import { filterPropertyType, isDateFilterType } from '../filterPropertyType.js';
import { FacetCard, FacetRow } from './FacetCard.js';
import { toggleValue } from './NestedFacet.js';
import { PropertyFacet } from './PropertyFacet.js';
import { TypeFacet } from './TypeFacet.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { ActiveFiltersSheet, type Chip } from './ActiveFiltersSheet.js';
import {
  NestedGroupsExpansionProvider,
  useNestedGroupsExpansionControls,
} from './useNestedGroupExpansion.js';

type LibraryFiltersProps = {
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  andFilters?: string[];
  onChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange?: (andFilters: string[]) => void;
  chips?: Chip[];
};

const nextFilters = (
  filters: LibraryFiltersState,
  key: string,
  values: string[]
): LibraryFiltersState => {
  const next = { ...filters };
  if (values.length) {
    next[key] = values;
  } else {
    delete next[key];
  }
  return next;
};

const statusCounts = (aggregations: LibraryAggregations) => {
  const publishedCount = aggregations.published.published;
  const restrictedCount = aggregations.published.restricted;
  return { publishedCount, restrictedCount, showStatus: publishedCount + restrictedCount > 0 };
};

const propertyFacetsFor = (
  properties: PropertySchema[],
  templates: Template[],
  aggregations: LibraryAggregations
) =>
  properties.filter(property => {
    const type = filterPropertyType(property, templates);
    if (type === 'text' || type === 'markdown' || type === 'numeric' || isDateFilterType(type)) {
      return true;
    }
    return (aggregations.properties[property.name] ?? []).some(bucket => bucket.count > 0);
  });

const activeFilterCount = (filters: LibraryFiltersState) =>
  Object.values(filters).reduce((sum, values) => sum + values.length, 0);

const LibraryFilters = ({
  aggregations,
  filters,
  andFilters = [],
  onChange,
  onAndFiltersChange = () => undefined,
  chips = [],
}: LibraryFiltersProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';
  const selection = { typeIds: filters.type ?? [], status: filters.status ?? [] };
  const { publishedCount, restrictedCount, showStatus } = statusCounts(aggregations);
  const propertyFacets = propertyFacetsFor(
    filterableProperties(templates, selection.typeIds),
    templates,
    aggregations
  );
  const activeCount = activeFilterCount(filters);
  const { expansion, expandAll, collapseAll } = useNestedGroupsExpansionControls();
  const setFilter = (key: string, values: string[]) => onChange(nextFilters(filters, key, values));
  const clearAll = () => {
    onChange({});
    onAndFiltersChange([]);
  };

  return (
    <NestedGroupsExpansionProvider value={expansion}>
      <div className="flex h-full min-h-0 flex-col bg-warm">
        <div className="flex-1 space-y-2 overflow-auto px-3.5 pt-2 pb-3">
          {showStatus && (
            <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
              <FacetCard title={<Translate>Status</Translate>}>
                <FacetRow
                  checked={selection.status.includes('restricted')}
                  onToggle={() => setFilter('status', toggleValue(selection.status, 'restricted'))}
                  label={<Translate>Restricted</Translate>}
                  icon={<LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
                  count={restrictedCount}
                  bold
                />
                <FacetRow
                  checked={selection.status.includes('published')}
                  onToggle={() => setFilter('status', toggleValue(selection.status, 'published'))}
                  label={<Translate>Published</Translate>}
                  icon={<GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
                  count={publishedCount}
                  bold
                />
              </FacetCard>
            </NeedAuthorization>
          )}

          <TypeFacet
            aggregations={aggregations}
            typeIds={selection.typeIds}
            setFilter={setFilter}
          />

          {propertyFacets.map(property => (
            <PropertyFacet
              key={property.name}
              property={property}
              templates={templates}
              aggregations={aggregations}
              filters={filters}
              setFilter={setFilter}
              locale={locale}
              typeIds={selection.typeIds}
              andFilters={andFilters}
              onAndFiltersChange={onAndFiltersChange}
            />
          ))}
        </div>

        <ActiveFiltersSheet chips={chips} onClearAll={clearAll} />

        <div className="flex h-12 shrink-0 items-center gap-2 border-t border-border px-3.5">
          <LibraryFooterButton onClick={collapseAll}>
            <Translate>Collapse all</Translate>
          </LibraryFooterButton>
          <LibraryFooterButton onClick={expandAll}>
            <Translate>Expand all</Translate>
          </LibraryFooterButton>
          <LibraryFooterButton className="ms-auto" onClick={clearAll} disabled={activeCount === 0}>
            <Translate>Clear</Translate>
          </LibraryFooterButton>
        </div>
      </div>
    </NestedGroupsExpansionProvider>
  );
};

export type { LibraryFiltersProps };
export { LibraryFilters };
