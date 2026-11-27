import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { toSearchEndpointQuery } from '#V2/services/search/librarySearchEndpoint.js';
import type { LibraryAggregations, LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import type { Template } from '#app/apiResponseTypes.js';
import { templateContextForProperty } from '../filterChipLabel.js';
import { MISSING_FACET_ID } from '../missingFacetLabel.js';
import { publishedStatusFromFilters, type LibraryFiltersState } from '../libraryUrlState.js';
import { filterPropertyType, isDateFilterType } from '../filterPropertyType.js';
import { lookupAggregation } from '../lookupAggregation.js';
import { type FacetMode } from './FacetCard.js';
import { KeywordFacet } from './KeywordFacet.js';
import { RelationshipFacet } from './RelationshipFacet.js';
import { NestedFacet, toggleValue } from './NestedFacet.js';
import { TextFacet } from './TextFacet.js';
import { NumericFacet } from './NumericFacet.js';
import { DateFacet } from './DateFacet.js';

type PropertyFacetProps = {
  property: PropertySchema;
  templates: Template[];
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  setFilter: (key: string, values: string[]) => void;
  locale: string;
  typeIds: string[];
  andFilters: string[];
  onAndFiltersChange: (andFilters: string[]) => void;
};

type PropertyFacetShared = PropertyFacetProps & {
  buckets: LibraryFacetBucket[];
  title: ReactNode;
  selected: string[];
  mode: FacetMode;
  onModeChange: (next: FacetMode) => void;
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

const omitMissingBuckets = (buckets: LibraryFacetBucket[]): LibraryFacetBucket[] =>
  buckets
    .filter(bucket => bucket.id !== MISSING_FACET_ID)
    .map(bucket =>
      bucket.values ? { ...bucket, values: omitMissingBuckets(bucket.values) } : bucket
    );

const facetTitle = (property: PropertySchema, templates: Template[], typeIds: string[]) => (
  <Translate
    context={templateContextForProperty(templates, property.name, typeIds) ?? property.name}
  >
    {property.label}
  </Translate>
);

const changeFacetMode = (
  andFilters: string[],
  name: string,
  change: { next: FacetMode; onAndFiltersChange: (andFilters: string[]) => void }
) => {
  const without = andFilters.filter(item => item !== name);
  change.onAndFiltersChange(change.next === 'and' ? [...without, name] : without);
};

const propertyFacetShared = (
  props: PropertyFacetProps,
  buckets: LibraryFacetBucket[]
): PropertyFacetShared => ({
  ...props,
  buckets,
  title: facetTitle(props.property, props.templates, props.typeIds),
  selected: props.filters[props.property.name] ?? [],
  mode: props.andFilters.includes(props.property.name) ? 'and' : 'or',
  onModeChange: next =>
    changeFacetMode(props.andFilters, props.property.name, {
      next,
      onAndFiltersChange: props.onAndFiltersChange,
    }),
});

const nestedPropertyFacet = (shared: PropertyFacetShared) => {
  if (!shared.buckets.length) {
    return null;
  }
  const selectedByGroup = Object.fromEntries(
    Object.entries(shared.filters).filter(([key]) => key.startsWith(`${shared.property.name}.`))
  );
  return (
    <NestedFacet
      title={shared.title}
      property={shared.property}
      groups={shared.buckets}
      selectedByGroup={selectedByGroup}
      onChangeGroup={(groupId, values) =>
        shared.setFilter(`${shared.property.name}.${groupId}`, values)
      }
      locale={shared.locale}
    />
  );
};

const numericPropertyFacet = (shared: PropertyFacetShared) => {
  const range = rangeFromValues(shared.selected);
  return (
    <NumericFacet
      title={shared.title}
      name={shared.property.name}
      from={range.from}
      to={range.to}
      onChange={({ from, to }) => shared.setFilter(shared.property.name, rangeToValues(from, to))}
    />
  );
};

const datePropertyFacet = (shared: PropertyFacetShared) => {
  const range = dateFromValues(shared.selected);
  return (
    <DateFacet
      title={shared.title}
      name={shared.property.name}
      from={range.from}
      to={range.to}
      onChange={({ from, to }) => shared.setFilter(shared.property.name, dateToValues(from, to))}
    />
  );
};

const textPropertyFacet = (shared: PropertyFacetShared) => (
  <TextFacet
    title={shared.title}
    name={shared.property.name}
    value={shared.selected[0] ?? ''}
    onChange={value => shared.setFilter(shared.property.name, value.trim() ? [value.trim()] : [])}
  />
);

const relationshipLookupQuery = (shared: PropertyFacetShared) => {
  const propertyFilters = Object.fromEntries(
    Object.entries(shared.filters).filter(([key]) => key !== 'type' && key !== 'status')
  );
  return toSearchEndpointQuery({
    templateIds: shared.typeIds,
    filters: propertyFilters,
    andFilters: shared.andFilters,
    publishedStatus: publishedStatusFromFilters(shared.filters.status),
  });
};

const relationshipPropertyFacet = (shared: PropertyFacetShared) => (
  <RelationshipFacet
    title={shared.title}
    buckets={shared.buckets}
    selected={shared.selected}
    onToggle={id => shared.setFilter(shared.property.name, toggleValue(shared.selected, id))}
    lookup={async searchTerm =>
      lookupAggregation(shared.property.name, searchTerm, relationshipLookupQuery(shared))
    }
    mode={shared.mode}
    onModeChange={shared.onModeChange}
    onClear={() => shared.setFilter(shared.property.name, [])}
  />
);

const keywordPropertyFacet = (shared: PropertyFacetShared, type: string) => (
  <KeywordFacet
    title={shared.title}
    buckets={shared.buckets}
    selected={shared.selected}
    onToggle={id => shared.setFilter(shared.property.name, toggleValue(shared.selected, id))}
    mode={shared.mode}
    onModeChange={type === 'multiselect' ? shared.onModeChange : undefined}
    valueContext={type === 'select' || type === 'multiselect' ? shared.property.content : undefined}
    onClear={() => shared.setFilter(shared.property.name, [])}
  />
);

const renderScalarFacet = (shared: PropertyFacetShared, type: string) => {
  if (type === 'numeric') {
    return numericPropertyFacet(shared);
  }
  if (isDateFilterType(type)) {
    return datePropertyFacet(shared);
  }
  if (type === 'text' || type === 'markdown') {
    return textPropertyFacet(shared);
  }
  return undefined;
};

const renderListFacet = (shared: PropertyFacetShared, type: string, bucketCount: number) => {
  if (type === 'nested') {
    return nestedPropertyFacet(shared);
  }
  if (type === 'relationship') {
    return relationshipPropertyFacet(shared);
  }
  if (!bucketCount) {
    return null;
  }
  return keywordPropertyFacet(shared, type);
};

const PropertyFacet = (props: PropertyFacetProps) => {
  const type = filterPropertyType(props.property, props.templates);
  const counted = (props.aggregations.properties[props.property.name] ?? []).filter(
    bucket => bucket.count > 0
  );
  const buckets = props.typeIds.length ? counted : omitMissingBuckets(counted);
  const shared = propertyFacetShared(props, buckets);
  const scalar = renderScalarFacet(shared, type);
  return scalar === undefined ? renderListFacet(shared, type, buckets.length) : scalar;
};

export type { PropertyFacetProps };
export { PropertyFacet };
