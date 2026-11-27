import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { toSearchEndpointQuery } from '#V2/services/search/librarySearchEndpoint.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import type { LibraryAggregations, LibraryPermissionPick } from '#shared/types/librarySearch.js';
import type { Template } from '#app/apiResponseTypes.js';
import { publishedStatusFromFilters, type LibraryFiltersState } from '../libraryUrlState.js';
import { filterPropertyType, isDateFilterType } from '../filterPropertyType.js';
import { lookupAggregation } from '../lookupAggregation.js';
import type { FacetMode } from './FacetCard.js';
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
  permissionFilters: LibraryPermissionPick[];
  permissionsAnd: boolean;
  applyPermissions: boolean;
};

type FacetShared = {
  type: ReturnType<typeof filterPropertyType>;
  buckets: LibraryAggregations['properties'][string];
  title: ReactNode;
  selected: string[];
  mode: FacetMode;
  onModeChange: (next: FacetMode) => void;
  lookupQuery: () => ReturnType<typeof toSearchEndpointQuery>;
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

const facetShared = ({
  property,
  templates,
  aggregations,
  filters,
  andFilters,
  onAndFiltersChange,
  permissionFilters,
  permissionsAnd,
  applyPermissions,
  typeIds,
}: PropertyFacetProps): FacetShared => {
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
  const lookupQuery = () =>
    toSearchEndpointQuery({
      templateIds: typeIds,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([key]) => key !== 'type' && key !== 'status')
      ),
      andFilters,
      publishedStatus: publishedStatusFromFilters(filters.status),
      ...(applyPermissions && permissionFilters.length
        ? { permissionFilters, ...(permissionsAnd ? { permissionsAnd: true } : {}) }
        : {}),
    });
  return { type, buckets, title, selected, mode, onModeChange, lookupQuery };
};

const nestedFacet = (
  { property, filters, setFilter, locale }: PropertyFacetProps,
  { buckets, title }: FacetShared
) => {
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
    />
  );
};

const numericFacet = (
  { property, setFilter }: PropertyFacetProps,
  { title, selected }: FacetShared
) => {
  const range = rangeFromValues(selected);
  return (
    <NumericFacet
      title={title}
      name={property.name}
      from={range.from}
      to={range.to}
      onChange={({ from, to }) => setFilter(property.name, rangeToValues(from, to))}
    />
  );
};

const dateFacet = (
  { property, setFilter }: PropertyFacetProps,
  { title, selected }: FacetShared
) => {
  const range = dateFromValues(selected);
  return (
    <DateFacet
      title={title}
      name={property.name}
      from={range.from}
      to={range.to}
      onChange={({ from, to }) => setFilter(property.name, dateToValues(from, to))}
    />
  );
};

const textFacet = (
  { property, setFilter }: PropertyFacetProps,
  { title, selected }: FacetShared
) => (
  <TextFacet
    title={title}
    name={property.name}
    value={selected[0] ?? ''}
    onChange={value => setFilter(property.name, value.trim() ? [value.trim()] : [])}
  />
);

const relationshipFacet = (
  { property, setFilter }: PropertyFacetProps,
  { buckets, title, selected, mode, onModeChange, lookupQuery }: FacetShared
) => (
  <RelationshipFacet
    title={title}
    buckets={buckets}
    selected={selected}
    onToggle={id => setFilter(property.name, toggleValue(selected, id))}
    lookup={async searchTerm => lookupAggregation(property.name, searchTerm, lookupQuery())}
    mode={mode}
    onModeChange={onModeChange}
    onClear={() => setFilter(property.name, [])}
  />
);

const keywordFacet = (
  { property, setFilter }: PropertyFacetProps,
  { type, buckets, title, selected, mode, onModeChange }: FacetShared
) => {
  if (!buckets.length) {
    return null;
  }
  return (
    <KeywordFacet
      title={title}
      buckets={buckets}
      selected={selected}
      onToggle={id => setFilter(property.name, toggleValue(selected, id))}
      mode={mode}
      onModeChange={type === 'multiselect' ? onModeChange : undefined}
      onClear={() => setFilter(property.name, [])}
    />
  );
};

const renderScalarFacet = (props: PropertyFacetProps, shared: FacetShared) => {
  if (shared.type === 'numeric') {
    return numericFacet(props, shared);
  }
  if (isDateFilterType(shared.type)) {
    return dateFacet(props, shared);
  }
  if (shared.type === 'text' || shared.type === 'markdown') {
    return textFacet(props, shared);
  }
  return undefined;
};

const renderListedFacet = (props: PropertyFacetProps, shared: FacetShared) => {
  if (shared.type === 'nested') {
    return nestedFacet(props, shared);
  }
  if (shared.type === 'relationship') {
    return relationshipFacet(props, shared);
  }
  return keywordFacet(props, shared);
};

const PropertyFacet = (props: PropertyFacetProps) => {
  const shared = facetShared(props);
  const scalar = renderScalarFacet(props, shared);
  if (scalar !== undefined) {
    return scalar;
  }
  return renderListedFacet(props, shared);
};

export { PropertyFacet };
