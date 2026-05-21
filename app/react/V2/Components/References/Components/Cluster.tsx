import React from 'react';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';

type ClusterProps = {
  position: number;
  references: EntityReference[];
};

const Cluster = ({ position, references }: ClusterProps) => {
  const animatedPosition = useAnimateToPosition(position);

  return (
    <button
      type="button"
      style={{ top: `${animatedPosition}px` }}
      className="absolute block h-6 w-6 rounded-full border border-border-soft bg-(--color-theme-surface-raised) text-[10px] cursor-pointer [transition-property:top] duration-500 ease-out"
    >
      {references.length}
    </button>
  );
};

export { Cluster };
