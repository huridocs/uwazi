import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { computeClusterOuterSize } from '../computeMarkerY.js';
import { Point } from './Point.js';
import { ShowMoreButton } from './ShowMoreButton.js';

type ClusterProps = {
  position: number;
  stackOrder?: number;
  trackRatio?: number;
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
const PAD = 2;
const BRANCH_LEN = 16;
const STEM_LEN = 12;
const TRUNK_X = POINT_SIZE + PAD + BRANCH_LEN;
const SVG_WIDTH = TRUNK_X + STEM_LEN;
const CLUSTER_STACK_BOOST = 500;
const LINE_STROKE = 'var(--color-theme-text-secondary)';
const LINE_OPACITY = 0.4;

const getTreeTopOffset = (trackRatio: number, outerSize: number, pointsHeight: number): number => {
  if (trackRatio < 0.25) {
    return outerSize / 2 - POINT_SIZE / 2;
  }
  if (trackRatio > 0.75) {
    return -(pointsHeight - POINT_SIZE) - (outerSize / 2 - POINT_SIZE / 2);
  }
  return -(pointsHeight / 2) + outerSize / 2;
};

const getStemMidY = (trackRatio: number, pointsHeight: number): number => {
  if (trackRatio < 0.25) {
    return POINT_SIZE / 2;
  }
  if (trackRatio > 0.75) {
    return pointsHeight - POINT_SIZE / 2;
  }
  return pointsHeight / 2;
};

const Cluster = ({
  position,
  stackOrder = 1,
  trackRatio = 0.5,
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

  const points = references.slice(0, 10);
  const extraPoints = references.slice(10);

  const clusterIsOpen = isOpen ?? internalIsOpen;
  const outerSize = computeClusterOuterSize(references.length);
  const hasActiveRef = references.some(ref => ref._id === activePointId);
  const rowCount = points.length + (extraPoints.length > 0 ? 1 : 0);
  const pointsHeight = (rowCount - 1) * POINT_SPACING + POINT_SIZE;
  const treeTopOffset = getTreeTopOffset(trackRatio, outerSize, pointsHeight);
  const stemMidY = getStemMidY(trackRatio, pointsHeight);
  const zIndex = clusterIsOpen ? stackOrder + 1500 : stackOrder + CLUSTER_STACK_BOOST;

  return (
    <div
      data-testid="rail-marker-cluster"
      className="pointer-events-auto absolute [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px`, zIndex }}
    >
      <button
        ref={setReferenceElement}
        data-testid="rail-marker"
        type="button"
        onClick={() => {
          onClusterClick?.(references);

          if (onToggle) {
            onToggle();
            return;
          }

        ?.setInternalIsOpen(currentValue => !currentValue);
        }}
        className={`relative isolate z-10 flex items-center justify-center rounded-full text-[9px] font-bold cursor-pointer border-[1.5px]
          pointer-events-auto ${
            clusterIsOpen || hasActiveRef
              ? 'border-(--border-primary) bg-(--bg-muted) text-ink'
              : 'border-(--border-soft) bg-(--color-theme-surface-raised) text-ink-tertiary'
          }`}
        style={{ width: outerSize, height: outerSize }}
      >
        {references.length}
      </button>

      {clusterIsOpen && (
        <div
          ref={setPopperElement}
          data-testid="cluster-subtree"
          className="absolute pointer-events-none"
          style={{ ...styles.popper, top: treeTopOffset, width: SVG_WIDTH, height: pointsHeight }}
        >
          <svg
            data-testid="cluster-subtree-svg"
            width={SVG_WIDTH}
            height={pointsHeight}
            className="absolute inset-0 overflow-visible"
            aria-hidden
          >
            <line
              x1={TRUNK_X}
              y1={stemMidY}
              x2={SVG_WIDTH}
              y2={stemMidY}
              stroke={LINE_STROKE}
              strokeOpacity={LinE_OPACITY}
              strokeWidth={1}
            />
            <line
              x1={TRUNK_X}
              y1={POINT_SIZE / 2}
              x2={TRUNK_X}
              y2={pointsHeight - POINT_SIZE / 2}
              stroke={LINE_STROKE}
              strokeOpacity={LINE_OPACITY}
              strokeWidth={1}
            />
            {Array.from({ length: rowCount }, (_, index) => {
              const cy = index * POINT_SPACING + POINT_SIZE / 2;
              return (
                <line
                  key={`branch-${index}`}
                  x1={POINT_SIZE + PAD}
                  y1={cy}
                  x2={TRUNK_X}
                  y2={cy}
                  stroke={LINE_STROKE}
                  strokeOpacity={LINE_OPACITY}
                  strokeWidth={1}
                />
              );
            })}
          </svg>

          <div
            className="absolute inset-0 pointer-events-auto"
            style={{ width: POINT_SIZE + PAD, left: 0 }}
          >
            {points.map((reference, index) => (
              <Point
                key={reference._id || `cluster-point-${index}`}
                position={index * POINT_SPACING}
                reference={reference}
                onClick={onPointClick}
                isActive={activePointId === reference._id}
              />
            ))}
            {extraPoints.length > 0 && (
              <ShowMoreButton
                position={points.length * POINT_SPACING}
                references={extraPoints}
                onClick={onMoreClick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { Cluster };
