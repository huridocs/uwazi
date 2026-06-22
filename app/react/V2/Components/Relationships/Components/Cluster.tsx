import React, { useState } from 'react';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { computeClusterOuterSize } from '../computeMarkerY.js';
import { RAIL_MARKER_SIZE, RAIL_MARKER_SPACING, railMarkerZIndex } from '../markerMetrics.js';
import { RelationshipMarker } from '../types.js';
import { Point } from './Point.js';
import { ShowMoreButton } from './ShowMoreButton.js';

type ClusterProps = {
  position: number;
  stackOrder?: number;
  references: RelationshipMarker[];
  onPointClick: (marker: RelationshipMarker) => void;
  onMoreClick: (markers: RelationshipMarker[]) => void;
  activePointId?: string | null;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

const PAD = 2;
const BRANCH_LEN = 16;
const STEM_LEN = 12;
const TRUNK_X = RAIL_MARKER_SIZE + PAD + BRANCH_LEN;
const SVG_WIDTH = TRUNK_X + STEM_LEN;
const LINE_STROKE = 'var(--color-theme-text-secondary)';
const LINE_OPACITY = 0.4;

const Cluster = ({
  position,
  stackOrder = 1,
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

  const points = references.slice(0, 10);
  const extraPoints = references.slice(10);

  const clusterIsOpen = isOpen ?? internalIsOpen;
  const outerSize = computeClusterOuterSize(references.length);
  const hasActiveRef = references.some(ref => ref._id === activePointId);
  const rowCount = points.length + (extraPoints.length > 0 ? 1 : 0);
  const pointsHeight = (rowCount - 1) * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE;
  const stemMidY = pointsHeight / 2;
  const treeTopOffset = outerSize / 2 - stemMidY;
  const zIndex = railMarkerZIndex(stackOrder, clusterIsOpen ? 'cluster-open' : 'cluster');

  return (
    <div
      data-testid="rail-marker-cluster"
      className="pointer-events-auto absolute [transition-property:top] duration-500 ease-out"
      style={{ top: `${animatedPosition}px`, zIndex }}
    >
      <button
        data-testid="rail-marker"
        type="button"
        onClick={() => {
          onClusterClick?.(references);

          if (onToggle) {
            onToggle();
            return;
          }

          setInternalIsOpen(currentValue => !currentValue);
        }}
        className={`relative isolate z-10 flex items-center justify-center rounded-full text-[9px] font-bold cursor-pointer border-[1.5px]
          pointer-events-auto ${
            clusterIsOpen || hasActiveRef
              ? 'border-ink bg-(--bg-muted) text-ink shadow-[0_0_0_2px_var(--color-theme-surface-raised)]'
              : 'border-(--border-soft) bg-(--color-theme-surface-raised) text-ink-tertiary'
          }`}
        style={{ width: outerSize, height: outerSize }}
      >
        {references.length}
      </button>

      {clusterIsOpen && (
        <div
          data-testid="cluster-subtree"
          className="absolute pointer-events-none"
          style={{ left: -SVG_WIDTH, top: treeTopOffset, width: SVG_WIDTH, height: pointsHeight }}
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
              strokeOpacity={LINE_OPACITY}
              strokeWidth={1}
            />
            <line
              x1={TRUNK_X}
              y1={RAIL_MARKER_SIZE / 2}
              x2={TRUNK_X}
              y2={pointsHeight - RAIL_MARKER_SIZE / 2}
              stroke={LINE_STROKE}
              strokeOpacity={LINE_OPACITY}
              strokeWidth={1}
            />
            {Array.from({ length: rowCount }, (_, index) => {
              const cy = index * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE / 2;
              return (
                <line
                  key={`branch-${index}`}
                  x1={RAIL_MARKER_SIZE + PAD}
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
            style={{ width: RAIL_MARKER_SIZE + PAD, left: 0 }}
          >
            {points.map((marker, index) => (
              <Point
                key={marker._id || `cluster-point-${index}`}
                position={index * RAIL_MARKER_SPACING}
                marker={marker}
                onClick={onPointClick}
                isActive={activePointId === marker._id}
              />
            ))}
            {extraPoints.length > 0 && (
              <ShowMoreButton
                position={points.length * RAIL_MARKER_SPACING}
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
