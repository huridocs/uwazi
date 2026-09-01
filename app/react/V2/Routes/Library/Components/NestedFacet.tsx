import React, { useState, type ReactNode } from 'react';
import nestedPropertyLabels from '#app/Templates/components/ViolatedArticlesNestedProperties.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import { FacetCard, FacetRow, TreeChildren } from './FacetCard.js';

type NestedFacetProps = {
  title: ReactNode;
  property: PropertySchema;
  groups: LibraryFacetBucket[];
  selectedByGroup: Record<string, string[]>;
  onChangeGroup: (groupId: string, values: string[]) => void;
  locale: string;
  open?: boolean;
  defaultExpanded?: boolean;
};

const nestedGroupLabel = (key: string, locale: string) => {
  const entry = nestedPropertyLabels[key.toLowerCase()] as Record<string, string> | undefined;
  return entry?.[`label_${locale}`] || entry?.label_en || key;
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

const NestedFacet = ({
  title,
  property,
  groups,
  selectedByGroup,
  onChangeGroup,
  locale,
  open = true,
  defaultExpanded = false,
}: NestedFacetProps) => {
  const reserveGutter = groups.some(group => Boolean(group.values?.length));
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    defaultExpanded
      ? Object.fromEntries(
          groups.filter(group => group.values?.length).map(group => [group.id, true])
        )
      : {}
  );

  return (
    <FacetCard title={title} open={open}>
      {groups.map(group => {
        const key = `${property.name}.${group.id}`;
        const selected = selectedByGroup[key] ?? selectedByGroup[group.id] ?? [];
        const anySelected = selected.includes('any');
        const isExpanded = Boolean(expanded[group.id]);
        const children = group.values ?? [];
        return (
          <React.Fragment key={group.id}>
            <FacetRow
              checked={anySelected}
              onToggle={() => onChangeGroup(group.id, anySelected ? [] : ['any'])}
              label={nestedGroupLabel(group.id, locale)}
              count={group.count}
              bold
              expandable={children.length > 0}
              expanded={isExpanded}
              reserveGutter={reserveGutter}
              onExpand={() =>
                setExpanded(current => ({ ...current, [group.id]: !current[group.id] }))
              }
            />
            {isExpanded && children.length > 0 && (
              <TreeChildren>
                {children.map(child => (
                  <FacetRow
                    key={child.id}
                    child
                    checked={!anySelected && selected.includes(child.id)}
                    onToggle={() =>
                      onChangeGroup(
                        group.id,
                        toggleValue(
                          selected.filter(value => value !== 'any'),
                          child.id
                        )
                      )
                    }
                    label={child.label || child.id}
                    count={child.count}
                  />
                ))}
              </TreeChildren>
            )}
          </React.Fragment>
        );
      })}
    </FacetCard>
  );
};

export type { NestedFacetProps };
export { NestedFacet, nestedGroupLabel, toggleValue };
