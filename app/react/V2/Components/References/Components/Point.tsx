import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Tooltip } from '#V2/Components/UI/index.js';

type PointProps = {
  position: number;
  reference: EntityReference;
  onClick: (reference: EntityReference) => void;
  isActive?: boolean;
};

const Point = ({ position, reference, onClick, isActive = false }: PointProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = useMemo(
    () => templates.find(template => template._id === reference.targetEntity.templateId),
    [reference, templates]
  );

  return (
    <button
      type="button"
      className="absolute cursor-pointer [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px` }}
      onClick={() => {
        onClick(reference);
      }}
    >
      <span no-translate="true" className="sr-only">
        {reference.targetEntity.title}
      </span>
      <Tooltip content={reference.targetEntity.title} placement="left">
        <span
          className={`block h-2.5 w-2.5 rounded-full transition-transform duration-150 ease-out ${
            isActive ? 'scale-150' : 'hover:scale-125'
          }`}
          style={{
            backgroundColor: targetTemplate?.color || '#000000',
          }}
        />
      </Tooltip>
    </button>
  );
};

export { Point };
