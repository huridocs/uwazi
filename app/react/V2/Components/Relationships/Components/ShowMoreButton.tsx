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
      data-testid="rail-show-more"
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
      <Translate className="sr-only">Show remaining in panel</Translate>
      <Tooltip
        content={<Translate>Show remaining in panel</Translate>}
        placement="left"
        arrow
        theme={{
          base: 'absolute z-10 inline-block rounded-lg px-3 py-1 text-sm font-medium shadow-sm transition-opacity duration-300',
          arrow: { style: { light: 'bg-white border-t border-r border-gray-200' } },
        }}
      >
        <EllipsisHorizontalCircleIcon className="w-3.5 h-3.5" />
      </Tooltip>
    </button>
  );
};

export { ShowMoreButton };
