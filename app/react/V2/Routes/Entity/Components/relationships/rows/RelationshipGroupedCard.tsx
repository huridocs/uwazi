import React, { useState, type ReactNode } from 'react';
import { CollapsibleSectionHeader } from '#V2/Components/UI/CollapsibleSectionHeader.js';
import { useExpandCollapseSignals } from '../hooks/useExpandCollapseSignals.js';

type RelationshipGroupedCardProps = {
  title: ReactNode;
  color?: string;
  count: number;
  markerIds: string[];
  children: ReactNode;
};

const RelationshipGroupedCard = ({
  title,
  color,
  count,
  markerIds,
  children,
}: RelationshipGroupedCardProps) => {
  const [expanded, setExpanded] = useState(false);
  useExpandCollapseSignals(setExpanded, markerIds);

  return (
    <div className="overflow-hidden rounded-md border border-border/40 bg-paper">
      <CollapsibleSectionHeader
        variant="group"
        title={title}
        expanded={expanded}
        onToggle={() => setExpanded(current => !current)}
        color={color}
        count={count}
      />
      {expanded && <div className="border-t border-border/40">{children}</div>}
    </div>
  );
};

export { RelationshipGroupedCard };
