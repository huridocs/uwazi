import React from 'react';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import type { Template } from '#app/apiResponseTypes.js';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { localeAtom, userAtom } from '#V2/atoms/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import type {
  LibraryAggregations,
  LibraryPermissionLevel,
  LibraryPermissionPick,
} from '#shared/types/librarySearch.js';
import { UserRole } from '#shared/types/userSchema.js';
import { type LibraryFiltersState } from '../libraryUrlState.js';
import { filterableProperties } from '../filterableProperties.js';
import { filterPropertyType, isDateFilterType } from '../filterPropertyType.js';
import { FacetCard, FacetRow } from './FacetCard.js';
import { toggleValue } from './NestedFacet.js';
import { TypeFacet } from './TypeFacet.js';
import { PropertyFacet } from './PropertyFacet.js';
import { PermissionsFacet } from './PermissionsFacet.js';
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
  permissionFilters?: LibraryPermissionPick[];
  permissionsAnd?: boolean;
  onChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange?: (andFilters: string[]) => void;
  onPermissionFiltersChange?: (picks: LibraryPermissionPick[]) => void;
  onPermissionsAndChange?: (and: boolean) => void;
  onClear?: () => void;
  chips?: Chip[];
};

const togglePermissionPick = (
  picks: LibraryPermissionPick[],
  level: LibraryPermissionLevel,
  refId: string
): LibraryPermissionPick[] => {
  const exists = picks.some(pick => pick.level === level && pick.refId === refId);
  if (exists) {
    return picks.filter(pick => pick.level !== level || pick.refId !== refId);
  }
  return [...picks, { level, refId }];
};

const useFacetList = (
  templates: Template[],
  filters: LibraryFiltersState,
  aggregations: LibraryAggregations
) => {
  const typeIds = filters.type ?? [];
  const status = filters.status ?? [];
  const properties = filterableProperties(templates, typeIds);
  const publishedCount = aggregations.published.published;
  const restrictedCount = aggregations.published.restricted;
  const propertyFacets = properties.filter(property => {
    const type = filterPropertyType(property, templates);
    if (type === 'text' || type === 'markdown' || type === 'numeric' || isDateFilterType(type)) {
      return true;
    }
    return (aggregations.properties[property.name] ?? []).some(bucket => bucket.count > 0);
  });
  return {
    typeIds,
    status,
    propertyFacets,
    publishedCount,
    restrictedCount,
    showStatus: publishedCount + restrictedCount > 0,
  };
};

const useFilterActions = ({
  filters,
  onChange,
  onClear,
  onAndFiltersChange,
  onPermissionFiltersChange,
  onPermissionsAndChange,
}: LibraryFiltersProps) => {
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
    if (onClear) {
      onClear();
      return;
    }
    onChange({});
    onAndFiltersChange?.([]);
    onPermissionFiltersChange?.([]);
    onPermissionsAndChange?.(false);
  };
  return { setFilter, clearAll };
};

const LibraryFilters = ({
  aggregations,
  filters,
  andFilters = [],
  permissionFilters = [],
  permissionsAnd = false,
  onChange,
  onAndFiltersChange = () => undefined,
  onPermissionFiltersChange = () => undefined,
  onPermissionsAndChange = () => undefined,
  onClear,
  chips = [],
}: LibraryFiltersProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';
  const applyPermissions = useAtomValue(userAtom)?.role === UserRole.ADMIN;
  const facets = useFacetList(templates, filters, aggregations);
  const { expansion, expandAll, collapseAll } = useNestedGroupsExpansionControls();
  const { setFilter, clearAll } = useFilterActions({
    aggregations,
    filters,
    onChange,
    onAndFiltersChange,
    onPermissionFiltersChange,
    onPermissionsAndChange,
    onClear,
  });
  const activeCount =
    Object.values(filters).reduce((sum, values) => sum + values.length, 0) +
    permissionFilters.length;
  const { typeIds, status, propertyFacets, publishedCount, restrictedCount, showStatus } = facets;

  return (
    <NestedGroupsExpansionProvider value={expansion}>
      <div className="flex h-full min-h-0 flex-col bg-warm">
        <div className="flex-1 space-y-2 overflow-auto px-3.5 pt-2 pb-3">
          {showStatus && (
            <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
              <FacetCard title={<Translate>Status</Translate>}>
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

          <TypeFacet aggregations={aggregations} typeIds={typeIds} setFilter={setFilter} />

          {propertyFacets.map(property => (
            <PropertyFacet
              key={property.name}
              property={property}
              templates={templates}
              aggregations={aggregations}
              filters={filters}
              setFilter={setFilter}
              locale={locale}
              typeIds={typeIds}
              andFilters={andFilters}
              onAndFiltersChange={onAndFiltersChange}
              permissionFilters={permissionFilters}
              permissionsAnd={permissionsAnd}
              applyPermissions={applyPermissions}
            />
          ))}

          {applyPermissions && (
            <PermissionsFacet
              read={aggregations.permissions?.read ?? []}
              write={aggregations.permissions?.write ?? []}
              selected={permissionFilters}
              mode={permissionsAnd ? 'and' : 'or'}
              onToggle={(level, refId) =>
                onPermissionFiltersChange(togglePermissionPick(permissionFilters, level, refId))
              }
              onModeChange={next => onPermissionsAndChange(next === 'and')}
              onClear={() => onPermissionFiltersChange([])}
            />
          )}
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
