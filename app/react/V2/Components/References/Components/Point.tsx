import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Tooltip } from '#V2/Components/UI/index.js';

type PointProps = {
  position: number;
  stackOrder?: number;
  reference: EntityReference;
  onClick: (reference: EntityReference) => void;
  isActive?: boolean;
};

const Point = ({ position, stackOrder = 1, reference, onClick, isActive = false }: PointProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = useMemo(
    () => templates.find(template => template._id === reference.targetEntity.templateId),
    [reference, templates]
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
        onClick(reference);
      }}
    >
      <span no-translate="true" className="sr-only">
        {reference.targetEntity.title}
      </span>
      <Tooltip content={reference.targetEntity.title} placement="left">
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
