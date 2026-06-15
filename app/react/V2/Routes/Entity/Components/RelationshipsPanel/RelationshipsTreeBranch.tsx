import React, { Children, useState, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { CollapsibleSectionHeader } from '#V2/Components/UI/CollapsibleSectionHeader.js';
import { relationshipsPanelZoomAtom } from './relationshipsPanelFiltersAtom.js';
import { useExpandCollapseSignals } from './useExpandCollapseSignals.js';

const RelationshipsTreeNode = ({ children }: { children: ReactNode }) => {
  const zoom = useAtomValue(relationshipsPanelZoomAtom);
  const showDot = zoom === 'overview';

  return (
    <div
      className={[
        'relative pl-5',
        "before:absolute before:bottom-0 before:left-0 before:top-0 before:border-l before:border-border-soft before:content-['']",
        'last:before:bottom-auto last:before:h-[18px]',
        "after:absolute after:left-0 after:top-[18px] after:w-[22px] after:border-t after:border-border-soft after:content-['']",
      ].join(' ')}
    >
      {showDot && (
        <span
          aria-hidden
          className="absolute z-[1] h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
          style={{ left: 0, top: '1.125rem' }}
        />
      )}
      {children}
    </div>
  );
};

type RelationshipsTreeBranchProps = {
  title: ReactNode;
  color?: string;
  count: number;
  markerIds: string[];
  defaultExpanded?: boolean;
  children: ReactNode;
};

const RelationshipsTreeBranch = ({
  title,
  color,
  count,
  markerIds,
  defaultExpanded = true,
  children,
}: RelationshipsTreeBranchProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  useExpandCollapseSignals(setExpanded, markerIds);

  const items = Children.toArray(children);

  return (
    <div>
      <CollapsibleSectionHeader
        variant="tree"
        title={title}
        expanded={expanded}
        onToggle={() => setExpanded(current => !current)}
        color={color}
        count={count}
      />
      {expanded && items.length > 0 && (
        <div className="ml-[14px]">
          {items.map((child, index) => (
            <RelationshipsTreeNode key={index}>{child}</RelationshipsTreeNode>
          ))}
        </div>
      )}
    </div>
  );
};

export { RelationshipsTreeBranch, RelationshipsTreeNode };
