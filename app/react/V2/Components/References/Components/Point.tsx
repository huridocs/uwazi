import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';

type PointProps = {
  position: number;
  reference: EntityReference;
};

const Point = ({ position, reference }: PointProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = useMemo(
    () => templates.find(template => template._id === reference.targetEntity.templateId),
    [reference, templates]
  );

  return (
    <span
      className="absolute block h-2.5 w-2.5 rounded-full [transition-property:top] duration-500 ease-out"
      style={{ backgroundColor: targetTemplate?.color || '#000000', top: `${animatedPosition}px` }}
    />
  );
};

export { Point };
