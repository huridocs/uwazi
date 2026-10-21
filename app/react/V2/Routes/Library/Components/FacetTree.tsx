import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { EntityIcon } from '#V2/Components/CustomIcons/EntityIcon.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import { FacetRow } from './FacetRow.js';
import { TreeChildren } from './TreeChildren.js';
import { useNestedGroupExpansion } from './useNestedGroupExpansion.js';

type FacetTreeProps = {
  buckets: LibraryFacetBucket[];
  selected: string[];
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
};

const bucketIcon = (bucket: LibraryFacetBucket) =>
  bucket.icon ? <EntityIcon data={bucket.icon} className="shrink-0" /> : undefined;

const FacetTree = ({
  buckets,
  selected,
  onToggle,
  defaultExpanded = false,
  forceExpanded = false,
}: FacetTreeProps) => {
  const groups = buckets.filter(bucket => bucket.id !== 'any');
  const reserveGutter = groups.some(bucket => Boolean(bucket.values?.length));
  const anyBucket = reserveGutter ? buckets.find(bucket => bucket.id === 'any') : undefined;
  const expandableIds = groups.filter(bucket => bucket.values?.length).map(bucket => bucket.id);
  const { expanded, toggleExpanded } = useNestedGroupExpansion(
    expandableIds,
    defaultExpanded ? expandableIds : []
  );

  return (
    <>
      {groups.map(bucket => {
        const hasChildren = Boolean(bucket.values?.length);
        const isExpanded = forceExpanded || Boolean(expanded[bucket.id]);
        return (
          <React.Fragment key={bucket.id}>
            <FacetRow
              checked={selected.includes(bucket.id)}
              onToggle={() => onToggle(bucket.id)}
              label={bucket.label || bucket.id}
              count={bucket.count}
              icon={bucketIcon(bucket)}
              bold
              expandable={hasChildren}
              expanded={isExpanded}
              reserveGutter={reserveGutter}
              onExpand={() => toggleExpanded(bucket.id)}
            />
            {hasChildren && isExpanded && (
              <TreeChildren>
                {bucket.values!.map(child => (
                  <FacetRow
                    key={child.id}
                    child
                    checked={selected.includes(child.id)}
                    onToggle={() => onToggle(child.id)}
                    label={child.label || child.id}
                    count={child.count}
                    icon={bucketIcon(child)}
                  />
                ))}
              </TreeChildren>
            )}
          </React.Fragment>
        );
      })}
      {anyBucket && (
        <FacetRow
          checked={selected.includes(anyBucket.id)}
          onToggle={() => onToggle(anyBucket.id)}
          label={<Translate>Any</Translate>}
          count={anyBucket.count}
          bold
          reserveGutter={reserveGutter}
        />
      )}
    </>
  );
};

export type { FacetTreeProps };
export { FacetTree };
