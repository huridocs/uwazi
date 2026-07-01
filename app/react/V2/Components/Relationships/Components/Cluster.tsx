import React, { useMemo, useState } from 'react';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { computeClusterOuterSize } from '../computeMarkerY.js';
import { RAIL_MARKER_SIZE, RAIL_MARKER_SPACING, railMarkerZIndex } from '../markerMetrics.js';
import { RelationshipMarker, compareMarkerAppearance, markerEvidenceKey } from '../types.js';
import { Point } from './Point.js';
import { ShowMoreButton } from './ShowMoreButton.js';

type ClusterProps = {
  position: number;
  markerLayerHeight?: number;
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
const BRANCH_LEN = 9;
const STEM_LEN = 8;
const POINT_INSET = 3;
const SUBTREE_EDGE_INSET = RAIL_MARKER_SPACING / 2;
const BRANCH_X = POINT_INSET + RAIL_MARKER_SIZE + PAD;
const TRUNK_X = BRANCH_X + BRANCH_LEN;
const SVG_WIDTH = TRUNK_X + STEM_LEN;
const LINE_STROKE = 'var(--color-theme-text-secondary)';
const LINE_OPACITY = 0.4;
const MAX_VISIBLE_POINTS = 18;

type ClusterSubtreeLayoutInput = {
  position: number;
  markerLayerHeight?: number;
  outerSize: number;
  rowCount: number;
};

type ClusterPointGroup = {
  marker: RelationshipMarker;
  markers: RelationshipMarker[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const groupClusterPoints = (references: RelationshipMarker[]): ClusterPointGroup[] => {
  const grouped = new Map<string, ClusterPointGroup>();
  [...references].sort(compareMarkerAppearance).forEach(marker => {
    const key = markerEvidenceKey(marker);
    const group = grouped.get(key);
    if (group) {
      group.markers.push(marker);
      if (compareMarkerAppearance(marker, group.marker) < 0) {
        group.marker = marker;
      }
      return;
    }
    grouped.set(key, { marker, markers: [marker] });
  });
  return Array.from(grouped.values()).sort((a, b) => compareMarkerAppearance(a.marker, b.marker));
};

const computeClusterSubtreeLayout = ({
  position,
  markerLayerHeight,
  outerSize,
  rowCount,
}: ClusterSubtreeLayoutInput) => {
  const height = (rowCount - 1) * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE;
  const center = position + outerSize / 2;
  const preferredTop = center - height / 2;
  const minTop = SUBTREE_EDGE_INSET;
  const maxTop = Math.max(minTop, (markerLayerHeight ?? height) - height - SUBTREE_EDGE_INSET);
  const top = markerLayerHeight === undefined ? preferredTop : clamp(preferredTop, minTop, maxTop);

  return {
    height,
    stemY: clamp(center - top, RAIL_MARKER_SIZE / 2, height - RAIL_MARKER_SIZE / 2),
    topOffset: top - position,
  };
};

const ClusterComponent = ({
  position,
  markerLayerHeight,
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

  const pointGroups = useMemo(() => groupClusterPoints(references), [references]);
  const points = pointGroups.slice(0, MAX_VISIBLE_POINTS);
  const hasExtra = pointGroups.length > MAX_VISIBLE_POINTS;

  const clusterIsOpen = isOpen ?? internalIsOpen;
  const outerSize = computeClusterOuterSize(references.length);
  const hasActiveRef = references.some(ref => ref._id === activePointId);
  const rowCount = points.length + (hasExtra ? 1 : 0);
  const subtree = computeClusterSubtreeLayout({ position, markerLayerHeight, outerSize, rowCount });
  const zIndex = railMarkerZIndex(stackOrder, clusterIsOpen ? 'cluster-open' : 'cluster');

  return (
    <div
      data-testid="rail-marker-cluster"
      data-stack-order={stackOrder}
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
          style={{
            left: -SVG_WIDTH,
            top: subtree.topOffset,
            width: SVG_WIDTH,
            height: subtree.height,
          }}
        >
          <svg
            data-testid="cluster-subtree-svg"
            width={SVG_WIDTH}
            height={subtree.height}
            className="absolute inset-0 overflow-visible"
            aria-hidden
          >
            <line
              x1={TRUNK_X}
              y1={subtree.stemY}
              x2={SVG_WIDTH}
              y2={subtree.stemY}
              stroke={LINE_STROKE}
              strokeOpacity={LINE_OPACITY}
              strokeWidth={1}
            />
            <line
              x1={TRUNK_X}
              y1={RAIL_MARKER_SIZE / 2}
              x2={TRUNK_X}
              y2={subtree.height - RAIL_MARKER_SIZE / 2}
              stroke={LINE_STROKE}
              strokeOpacity={LINE_OPACITY}
              strokeWidth={1}
            />
            {Array.from({ length: rowCount }, (_, index) => {
              const cy = index * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE / 2;
              return (
                <line
                  key={`branch-${index}`}
                  x1={BRANCH_X}
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
            style={{ width: RAIL_MARKER_SIZE + PAD, left: POINT_INSET }}
          >
            {points.map(({ marker, markers }, index) => (
              <Point
                key={marker._id || `cluster-point-${index}`}
                position={index * RAIL_MARKER_SPACING}
                marker={marker}
                onClick={onPointClick}
                isActive={markers.some(pointMarker => pointMarker._id === activePointId)}
                representedCount={markers.length}
              />
            ))}
            {hasExtra && (
              <ShowMoreButton
                position={points.length * RAIL_MARKER_SPACING}
                references={pointGroups.slice(MAX_VISIBLE_POINTS).flatMap(group => group.markers)}
                onClick={onMoreClick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Cluster = React.memo(ClusterComponent);

export { Cluster, computeClusterSubtreeLayout };
