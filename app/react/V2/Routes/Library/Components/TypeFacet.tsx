import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { toggleValue } from './NestedFacet.js';
import { FacetCard, FacetRow, TreeChildren } from './FacetCard.js';
import { useNestedGroupExpansion } from './useNestedGroupExpansion.js';
import {
  toggleTypeGroup,
  typeFilterItems,
  type LibraryTypeFilterItem,
} from '../libraryTypeFilters.js';

type TypeFacetProps = {
  aggregations: LibraryAggregations;
  typeIds: string[];
  setFilter: (key: string, values: string[]) => void;
  open?: boolean;
};

const useTypeGroupExpansion = (items: LibraryTypeFilterItem[], typeIds: string[]) => {
  const reserveGutter = items.some(item => Boolean(item.items?.length));
  const groupIds = items.filter(item => item.items?.length).map(item => item.id);
  const initiallyExpandedIds = items
    .filter(item => item.items?.some(child => typeIds.includes(child.id)))
    .map(item => item.id);
  const { expanded, toggleExpanded } = useNestedGroupExpansion(groupIds, initiallyExpandedIds);
  return { expanded, reserveGutter, toggleExpanded };
};

const TypeFacet = ({ aggregations, typeIds, setFilter, open = true }: TypeFacetProps) => {
  const templates = useAtomValue(templatesAtom);
  const settings = useAtomValue(settingsAtom);
  const items = typeFilterItems(settings.filters, templates);
  const { expanded, reserveGutter, toggleExpanded } = useTypeGroupExpansion(items, typeIds);

  const countById = new Map(aggregations.templates.map(bucket => [bucket.id, bucket.count]));
  const countFor = (item: LibraryTypeFilterItem) =>
    item.items?.length
      ? item.items.reduce((sum, child) => sum + (countById.get(child.id) ?? 0), 0)
      : (countById.get(item.id) ?? 0);

  if (!items.length) {
    return null;
  }

  return (
    <FacetCard title={<Translate>Type</Translate>} open={open}>
      {items.map(item => {
        const children = item.items;
        if (children?.length) {
          const isExpanded = Boolean(expanded[item.id]);
          return (
            <React.Fragment key={item.id}>
              <FacetRow
                checked={children.every(child => typeIds.includes(child.id))}
                onToggle={() =>
                  setFilter(
                    'type',
                    toggleTypeGroup(
                      typeIds,
                      children.map(child => child.id)
                    )
                  )
                }
                label={<Translate context="Filters">{item.name}</Translate>}
                count={countFor(item)}
                bold
                expandable
                expanded={isExpanded}
                reserveGutter={reserveGutter}
                onExpand={() => toggleExpanded(item.id)}
              />
              {isExpanded && (
                <TreeChildren>
                  {children.map(child => (
                    <FacetRow
                      key={child.id}
                      child
                      checked={typeIds.includes(child.id)}
                      onToggle={() => setFilter('type', toggleValue(typeIds, child.id))}
                      label={<Translate context={child.id}>{child.name}</Translate>}
                      count={countFor(child)}
                    />
                  ))}
                </TreeChildren>
              )}
            </React.Fragment>
          );
        }

        return (
          <FacetRow
            key={item.id}
            checked={typeIds.includes(item.id)}
            onToggle={() => setFilter('type', toggleValue(typeIds, item.id))}
            label={<Translate context={item.id}>{item.name}</Translate>}
            count={countFor(item)}
            bold
            reserveGutter={reserveGutter}
          />
        );
      })}
    </FacetCard>
  );
};

export { TypeFacet };
export type { TypeFacetProps };
