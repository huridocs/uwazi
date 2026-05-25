import React, { useState } from 'react';
import { usePopper } from 'react-popper';
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
const BUTTON_SIZE = 24;
const CONNECTOR_HEIGHT = 2;
const CONNECTOR_WIDTH = 13;

const Cluster = ({ position, references, onPointClick, isOpen, onToggle }: ClusterProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const clusterIsOpen = isOpen ?? internalIsOpen;
  const pointsHeight = (references.length - 1) * POINT_SPACING + POINT_SIZE;

  const { styles } = usePopper(referenceElement, popperElement, {
    placement: 'left',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
        },
      },
    ],
  });

  return (
    <div
      className="absolute [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px` }}
    >
      <button
        ref={setReferenceElement}
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
          className="absolute bg-(--color-theme-border-soft)"
          style={{
            top: `${BUTTON_SIZE / 2 - CONNECTOR_HEIGHT / 2}px`,
            left: `${-BUTTON_SIZE / 2}px`,
            width: `${CONNECTOR_WIDTH}px`,
            height: `${CONNECTOR_HEIGHT}px`,
          }}
        />
      )}

      {clusterIsOpen && (
        <div ref={setPopperElement} className="absolute" style={styles.popper}>
          <div
            className="relative"
            style={{
              width: `${POINT_SIZE}px`,
              height: `${pointsHeight}px`,
              left: '-8px',
            }}
          >
            <div
              className="absolute w-0.5 bg-(--color-theme-border-soft)"
              style={{
                top: 0,
                left: `${POINT_SIZE / 2 - 1}px`,
                height: `${pointsHeight}px`,
              }}
            />
            <div
              className="absolute"
              style={{
                left: 0,
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
        </div>
      )}
    </div>
  );
};

export { Cluster };
