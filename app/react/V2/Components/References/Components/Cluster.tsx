import React, { useState } from 'react';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { Point } from './Point.js';

type ClusterProps = {
  position: number;
  references: EntityReference[];
  onPointClick: (reference: EntityReference) => void;
};

const Cluster = ({ position, references, onPointClick }: ClusterProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="absolute transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px` }}
    >
      <button
        type="button"
        onClick={() => {
          setIsOpen(currentValue => !currentValue);
        }}
        className="relative h-6 w-6 items-center rounded-full border bg-(--color-theme-surface-raised) text-[10px] cursor-pointer"
      >
        {references.length}
      </button>

      {isOpen && (
        <>
          <div className="h-0.5 w-4 bg-alert-800 absolute top-1/2 -left-4">
            <div
              className="w-0.5 bg-alert-800 absolute"
              style={{
                height: `${24 * references.length}px`,
                top: `-${10 * references.length}px`,
              }}
            />
          </div>
          <div
            className="absolute"
            style={{
              top: `-${5 * references.length}px`,
              right: '60px',
            }}
          >
            {references.map((reference, index) => (
              <Point
                key={reference._id || `cluster-point-${index}`}
                position={index * 24}
                reference={reference}
                onClick={onPointClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { Cluster };
