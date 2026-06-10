import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { RelationshipMarker } from '../types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Tooltip } from '#V2/Components/UI/index.js';

type PointProps = {
  position: number;
  stackOrder?: number;
  marker: RelationshipMarker;
  onClick: (marker: RelationshipMarker) => void;
  isActive?: boolean;
};

const Point = ({ position, stackOrder = 1, marker, onClick, isActive = false }: PointProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = useMemo(
    () => templates.find(template => template._id === marker.target.templateId),
    [marker, templates]
  );
  const color = targetTemplate?.color || '#000000';
  const size = isActive ? 14 : 10;

  return (
    <button
      type="button"
      data-testid="rail-marker"
      className="pointer-events-auto absolute cursor-pointer [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px`, zIndex: isActive ? stackOrder + 50 : stackOrder }}
      onClick={() => {
        onClick(marker);
      }}
    >
      <span no-translate="true" className="sr-only">
        {marker.target.title}
      </span>
      <Tooltip content={marker.target.title} placement="left">
        <span
          className="block rounded-full transition-all duration-150 ease-out hover:scale-125"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            opacity: isActive ? 1 : 0.7,
            boxShadow: isActive ? `0 0 0 2px ${color}44` : 'none',
          }}
        />
      </Tooltip>
    </button>
  );
};

export { Point };
