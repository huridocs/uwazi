import React, { useMemo, useState } from 'react';
import { usePopper } from 'react-popper';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { Point } from './Point.js';
import { ShowMoreButton } from './ShowMoreButton.js';

type ClusterProps = {
  position: number;
  references: EntityReference[];
  onPointClick: (reference: EntityReference) => void;
  onMoreClick: (references: EntityReference[]) => void;
  activePointId?: string | null;
  onClusterClick?: (references: EntityReference[]) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

const POINT_SPACING = 24;
const POINT_SIZE = 10;
const BUTTON_SIZE = 24;
const CONNECTOR_HEIGHT = 2;
const CONNECTOR_WIDTH = 13;

const Cluster = ({
  position,
  references,
  onPointClick,
  onMoreClick,
  activePointId,
  onClusterClick,
  isOpen,
  onToggle,
}: ClusterProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

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

  const { points, extraPoints } = useMemo(
    () => ({
      points: references.slice(0, 10),
      extraPoints: references.slice(10, references.length),
    }),
    [references]
  );

  const clusterIsOpen = isOpen ?? internalIsOpen;
  const pointsHeight =
    (points.length - (extraPoints.length > 0 ? 0 : 1)) * POINT_SPACING + POINT_SIZE;

  return (
    <div
      className="absolute [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px` }}
    >
      <button
        ref={setReferenceElement}
        type="button"
        onClick={() => {
          onClusterClick?.(references);

          if (onToggle) {
            onToggle();
            return;
          }

          setInternalIsOpen(currentValue => !currentValue);
        }}
        className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] cursor-pointer border ${clusterIsOpen ? 'border-(--border-primary) bg-(--bg-muted)' : 'border-(--border-soft) bg-(--color-theme-surface-raised)'}`}
      >
        {references.length}
      </button>

      {clusterIsOpen && (
        <div
          className="absolute bg-(--color-theme-border-default)"
          style={{
            top: BUTTON_SIZE / 2 - CONNECTOR_HEIGHT / 2,
            left: -BUTTON_SIZE / 2,
            width: CONNECTOR_WIDTH,
            height: CONNECTOR_HEIGHT,
          }}
        />
      )}

      {clusterIsOpen && (
        <div ref={setPopperElement} className="absolute" style={styles.popper}>
          <div
            className="absolute w-0.5 bg-(--color-theme-border-default)"
            style={{
              top: POINT_SIZE / 2,
              left: '-2px',
              height: pointsHeight - 10,
            }}
          />
          <div
            className="relative"
            style={{
              width: POINT_SIZE,
              height: pointsHeight,
              left: '-20px',
            }}
          >
            <div
              className="absolute"
              style={{
                left: 0,
                top: 0,
                height: pointsHeight,
                width: POINT_SIZE,
              }}
            >
              {points?.map((reference, index) => (
                <React.Fragment key={reference._id || `cluster-point-${index}`}>
                  <div
                    className="absolute w-full h-0.5 bg-(--color-theme-border-default)"
                    style={{
                      left: '10px',
                      top: index * POINT_SPACING + POINT_SIZE / 2 - 1,
                    }}
                  />
                  <Point
                    position={index * POINT_SPACING}
                    reference={reference}
                    onClick={onPointClick}
                    isActive={activePointId === reference._id}
                  />
                </React.Fragment>
              ))}
              {extraPoints?.length ? (
                <React.Fragment key="show-more-button">
                  <div
                    className="absolute w-full h-0.5 bg-(--color-theme-border-default)"
                    style={{
                      left: '10px',
                      top: points.length * POINT_SPACING + POINT_SIZE / 2,
                    }}
                  />
                  <ShowMoreButton
                    position={points.length * POINT_SPACING}
                    references={extraPoints}
                    onClick={onMoreClick}
                  />
                </React.Fragment>
              ) : undefined}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Cluster };
