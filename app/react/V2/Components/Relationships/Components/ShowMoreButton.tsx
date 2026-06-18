import React from 'react';
import { EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/index.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { RAIL_MARKER_SIZE } from '../markerMetrics.js';
import { RelationshipMarker } from '../types.js';

type ShowMoreButtonProps = {
  position: number;
  references: RelationshipMarker[];
  onClick: (markers: RelationshipMarker[]) => void;
};

const ShowMoreButton = ({ position, references, onClick }: ShowMoreButtonProps) => {
  const animatedPosition = useAnimateToPosition(position);

  return (
    <button
      className="absolute flex items-center justify-center [transition-property:top] duration-500 ease-out cursor-pointer rounded-full bg-(--color-theme-surface-raised)"
      style={{
        top: `${animatedPosition}px`,
        left: 0,
        width: RAIL_MARKER_SIZE,
        height: RAIL_MARKER_SIZE,
      }}
      type="button"
      onClick={() => onClick(references)}
    >
      <Translate className="sr-only">Show more</Translate>
      <Tooltip content={<Translate>Show more</Translate>} placement="left">
        <EllipsisHorizontalCircleIcon className="w-3.5 h-3.5" />
      </Tooltip>
    </button>
  );
};

export { ShowMoreButton };
