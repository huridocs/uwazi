import React, {
  Children,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { CollapsibleSectionHeader } from '#V2/Components/UI/CollapsibleSectionHeader.js';
import { useExpandCollapseSignals } from '../hooks/useExpandCollapseSignals.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

type TreeLine = 'only' | 'first' | 'middle' | 'last';

const getTreeLine = (index: number, count: number): TreeLine => {
  if (count <= 1) return 'only';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
};

const treeLineBeforeClass: Record<TreeLine, string> = {
  only: 'before:top-0 before:h-[18px]',
  first: 'before:top-0 before:bottom-0',
  middle: 'before:top-0 before:bottom-0',
  last: 'before:top-0 before:h-[18px]',
};

const treeNodeBaseClass = [
  'relative pl-5',
  "before:absolute before:left-0 before:border-l before:border-border-soft before:content-['']",
  "after:absolute after:left-0 after:top-[18px] after:w-[22px] after:border-t after:border-border-soft after:content-['']",
].join(' ');

type RelationshipsTreeNodeProps = {
  children: ReactNode;
  treeLine?: TreeLine;
};

const RelationshipsTreeNode = ({ children, treeLine = 'only' }: RelationshipsTreeNodeProps) => {
  const { zoom } = useRelationshipsPanelLayout();
  const showDot = zoom === 'overview';

  return (
    <div className={`${treeNodeBaseClass} ${treeLineBeforeClass[treeLine]}`}>
      {showDot && (
        <span
          aria-hidden
          className="absolute z-1 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
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
  connectHeader?: boolean;
  treeLine?: TreeLine;
  children: ReactNode;
};

// eslint-disable-next-line react/no-multi-comp
const RelationshipsTreeBranch = ({
  title,
  color,
  count,
  markerIds,
  defaultExpanded = true,
  connectHeader = true,
  treeLine = 'only',
  children,
}: RelationshipsTreeBranchProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  useExpandCollapseSignals(setExpanded, markerIds);

  const items = Children.toArray(children);

  const header = (
    <CollapsibleSectionHeader
      variant="tree"
      title={title}
      expanded={expanded}
      onToggle={() => setExpanded(current => !current)}
      color={color}
      count={count}
    />
  );

  const childList =
    expanded && items.length > 0 ? (
      <div className="ml-[14px]">
        {items.map((child, index) => {
          const line = getTreeLine(index, items.length);
          if (
            isValidElement(child) &&
            (child as ReactElement<RelationshipsTreeBranchProps>).type === RelationshipsTreeBranch
          ) {
            return React.cloneElement(child as ReactElement<RelationshipsTreeBranchProps>, {
              treeLine: line,
              connectHeader: true,
            });
          }
          return (
            // eslint-disable-next-line react/no-array-index-key
            <RelationshipsTreeNode key={index} treeLine={line}>
              {child}
            </RelationshipsTreeNode>
          );
        })}
      </div>
    ) : null;

  if (!connectHeader) {
    return (
      <div>
        {header}
        {childList}
      </div>
    );
  }

  return (
    <RelationshipsTreeNode treeLine={treeLine}>
      {header}
      {childList}
    </RelationshipsTreeNode>
  );
};

export type { TreeLine };
export { RelationshipsTreeBranch, RelationshipsTreeNode, getTreeLine };
