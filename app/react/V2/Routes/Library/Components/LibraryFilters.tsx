import React, { useState } from 'react';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { localeAtom } from '#V2/atoms/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { toSearchEndpointQuery } from '#V2/services/search/librarySearchEndpoint.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import type { Template } from '#app/apiResponseTypes.js';
import { publishedStatusFromFilters, type LibraryFiltersState } from '../libraryUrlState.js';
import { filterableProperties } from '../filterableProperties.js';
import { filterPropertyType, isDateFilterType } from '../filterPropertyType.js';
import { lookupAggregation } from '../lookupAggregation.js';
import { FacetCard, FacetRow, type FacetMode } from './FacetCard.js';
import { KeywordFacet } from './KeywordFacet.js';
import { RelationshipFacet } from './RelationshipFacet.js';
import { NestedFacet, toggleValue } from './NestedFacet.js';
import { TextFacet } from './TextFacet.js';
import { NumericFacet } from './NumericFacet.js';
import { DateFacet } from './DateFacet.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { ActiveFiltersSheet, type Chip } from './ActiveFiltersSheet.js';

type LibraryFiltersProps = {
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  andFilters?: string[];
  onChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange?: (andFilters: string[]) => void;
  chips?: Chip[];
};

const rangeFromValues = (values: string[] | undefined) => ({
  from: values?.[0] ?? '',
  to: values?.[1] ?? '',
});

const dateFromValues = (values: string[] | undefined) => ({
  from: values?.[0] ? Number(values[0]) : undefined,
  to: values?.[1] ? Number(values[1]) : undefined,
});

const rangeToValues = (from: string, to: string): string[] => {
  if (!from && !to) {
    return [];
  }
  return [from, to];
};

const dateToValues = (from?: number, to?: number): string[] => {
  if (from === undefined && to === undefined) {
    return [];
  }
  return [from === undefined ? '' : String(from), to === undefined ? '' : String(to)];
};

const PropertyFacet = ({
  property,
  templates,
  aggregations,
  filters,
  setFilter,
  open,
  locale,
  typeIds,
  andFilters,
  onAndFiltersChange,
}: {
  property: PropertySchema;
  templates: Template[];
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  setFilter: (key: string, values: string[]) => void;
  open: boolean;
  locale: string;
  typeIds: string[];
  andFilters: string[];
  onAndFiltersChange: (andFilters: string[]) => void;
}) => {
  const type = filterPropertyType(property, templates);
  const buckets = (aggregations.properties[property.name] ?? []).filter(bucket => bucket.count > 0);
  const title = (
    <Translate context={property._id ? String(property._id) : property.name}>
      {property.label}
    </Translate>
  );
  const selected = filters[property.name] ?? [];
  const mode: FacetMode = andFilters.includes(property.name) ? 'and' : 'or';
  const onModeChange = (next: FacetMode) => {
    const without = andFilters.filter(name => name !== property.name);
    onAndFiltersChange(next === 'and' ? [...without, property.name] : without);
  };
  const lookupQuery = () => {
    const propertyFilters = Object.fromEntries(
      Object.entries(filters).filter(([key]) => key !== 'type' && key !== 'status')
    );
    return toSearchEndpointQuery({
      templateIds: typeIds,
      filters: propertyFilters,
      andFilters,
      publishedStatus: publishedStatusFromFilters(filters.status),
    });
  };

  if (type === 'nested') {
    if (!buckets.length) {
      return null;
    }
    const selectedByGroup = Object.fromEntries(
      Object.entries(filters).filter(([key]) => key.startsWith(`${property.name}.`))
    );
    return (
      <NestedFacet
        title={title}
        property={property}
        groups={buckets}
        selectedByGroup={selectedByGroup}
        onChangeGroup={(groupId, values) => setFilter(`${property.name}.${groupId}`, values)}
        locale={locale}
        open={open}
      />
    );
  }

  if (type === 'numeric') {
    const range = rangeFromValues(selected);
    return (
      <NumericFacet
        title={title}
        name={property.name}
        from={range.from}
        to={range.to}
        onChange={({ from, to }) => setFilter(property.name, rangeToValues(from, to))}
        open={open}
      />
    );
  }

  if (isDateFilterType(type)) {
    const range = dateFromValues(selected);
    return (
      <DateFacet
        title={title}
        name={property.name}
        from={range.from}
        to={range.to}
        onChange={({ from, to }) => setFilter(property.name, dateToValues(from, to))}
        open={open}
      />
    );
  }

  if (type === 'text' || type === 'markdown') {
    return (
      <TextFacet
        title={title}
        name={property.name}
        value={selected[0] ?? ''}
        onChange={value => setFilter(property.name, value ? [value] : [])}
        open={open}
      />
    );
  }

  if (type === 'relationship') {
    return (
      <RelationshipFacet
        title={title}
        buckets={buckets}
        selected={selected}
        onToggle={id => setFilter(property.name, toggleValue(selected, id))}
        lookup={async searchTerm => lookupAggregation(property.name, searchTerm, lookupQuery())}
        open={open}
        mode={mode}
        onModeChange={onModeChange}
        onClear={() => setFilter(property.name, [])}
      />
    );
  }

  if (!buckets.length) {
    return null;
  }

  return (
    <KeywordFacet
      title={title}
      buckets={buckets}
      selected={selected}
      onToggle={id => setFilter(property.name, toggleValue(selected, id))}
      open={open}
      mode={mode}
      onModeChange={type === 'multiselect' ? onModeChange : undefined}
      onClear={() => setFilter(property.name, [])}
    />
  );
};

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
  const typeIds = filters.type ?? [];
  const status = filters.status ?? [];
  const templateById = new Map(templates.map(template => [template._id, template]));
  const properties = filterableProperties(templates, typeIds);

  const publishedCount = aggregations.published.published;
  const restrictedCount = aggregations.published.restricted;
  const showStatus = publishedCount + restrictedCount > 0;

  const propertyFacets = properties.filter(property => {
    const type = filterPropertyType(property, templates);
    if (type === 'text' || type === 'markdown' || type === 'numeric' || isDateFilterType(type)) {
      return true;
    }
    return (aggregations.properties[property.name] ?? []).some(bucket => bucket.count > 0);
  });

  const activeCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0);
  const facetIds = ['status', 'type', ...propertyFacets.map(property => property.name)];
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

  const clearAll = () => {
    onChange({});
    onAndFiltersChange([]);
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

        {propertyFacets.map(property => (
          <PropertyFacet
            key={property.name}
            property={property}
            templates={templates}
            aggregations={aggregations}
            filters={filters}
            setFilter={setFilter}
            open={isOpen(property.name)}
            locale={locale}
            typeIds={typeIds}
            andFilters={andFilters}
            onAndFiltersChange={onAndFiltersChange}
          />
        ))}
      </div>

      <ActiveFiltersSheet chips={chips} onClearAll={clearAll} />

      <div className="flex h-12 shrink-0 items-center gap-2 border-t border-border px-3.5">
        <LibraryFooterButton onClick={() => setAllFacets(false)}>
          <Translate>Collapse all</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton onClick={() => setAllFacets(true)}>
          <Translate>Expand all</Translate>
        </LibraryFooterButton>
        <LibraryFooterButton className="ms-auto" onClick={clearAll} disabled={activeCount === 0}>
          <Translate>Clear</Translate>
        </LibraryFooterButton>
      </div>
    </div>
  );
};

export type { LibraryFiltersProps };
export { LibraryFilters };
