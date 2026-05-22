import React, { useState } from 'react';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { Point } from './Point.js';

type ClusterProps = {
  position: number;
  references: EntityReference[];
  onPointClick: (reference: EntityReference) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

const POINT_SPACING = 24;
const POINT_SIZE = 10;
const CONNECTOR_WIDTH = 20;

const Cluster = ({ position, references, onPointClick, isOpen, onToggle }: ClusterProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const clusterIsOpen = isOpen ?? internalIsOpen;
  const pointsHeight = (references.length - 1) * POINT_SPACING + POINT_SIZE;
  const connectorY = pointsHeight / 2;

  return (
    <div
      className="absolute [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px` }}
    >
      <button
        type="button"
        onClick={() => {
          if (onToggle) {
            onToggle();
            return;
          }

          setInternalIsOpen(currentValue => !currentValue);
        }}
        className="relative flex h-6 w-6 items-center justify-center rounded-full border bg-(--color-theme-surface-raised) text-[10px] cursor-pointer"
      >
        {references.length}
      </button>

      {clusterIsOpen && (
        <div
          className="absolute top-1/2"
          style={{
            right: '100%',
            transform: 'translateY(-50%)',
            width: `${CONNECTOR_WIDTH}px`,
            height: `${pointsHeight}px`,
          }}
        >
          <div
            className="absolute h-0.5 bg-(--color-theme-border-soft)"
            style={{
              top: `${connectorY}px`,
              left: 0,
              width: `${CONNECTOR_WIDTH}px`,
            }}
          />
          <div
            className="absolute w-0.5 bg-(--color-theme-border-soft)"
            style={{
              top: 0,
              left: 0,
              height: `${pointsHeight}px`,
            }}
          />
          <div
            className="absolute"
            style={{
              left: `-${POINT_SIZE / 2 - 1}px`,
              top: 0,
              height: `${pointsHeight}px`,
              width: `${POINT_SIZE}px`,
            }}
          >
            {references.map((reference, index) => (
              <Point
                key={reference._id || `cluster-point-${index}`}
                position={index * POINT_SPACING}
                reference={reference}
                onClick={onPointClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { Cluster };
