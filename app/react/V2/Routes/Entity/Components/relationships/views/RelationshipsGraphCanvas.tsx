import React from 'react';
import {
  CX,
  CY,
  SOURCE_R,
  VIEW_H,
  VIEW_W,
  type GraphNode,
  type GraphSpoke,
} from '#V2/formatters/relationships/relationshipsPanelGraph.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';

const BRANCH_W = 110;
const BRANCH_H = 22;

type GraphCanvasProps = {
  spokes: GraphSpoke[];
  nodes: GraphNode[];
  groupBy: RelationshipsPanelGroupBy;
  transform: { tx: number; ty: number; scale: number };
  selfTitle: string;
  selfTypeName: string;
  selfColor: string;
  sourceLabel: string;
  sourceLabelW: number;
  dragMoved: () => boolean;
  onNodeClick: (markerId: string) => void;
  onHover: (
    e: React.PointerEvent,
    node: { title: string; typeName: string; evidenceCount: number }
  ) => void;
  onHoverEnd: () => void;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
};

const RelationshipsGraphCanvas = ({
  spokes,
  nodes,
  groupBy,
  transform,
  selfTitle,
  selfTypeName,
  selfColor,
  sourceLabel,
  sourceLabelW,
  dragMoved,
  onNodeClick,
  onHover,
  onHoverEnd,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: GraphCanvasProps) => (
  <svg
    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    preserveAspectRatio="xMidYMid meet"
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerLeave={onPointerUp}
    onWheel={onWheel}
    className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
  >
    <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
      {spokes.map(spoke => {
        const branchNodes = nodes.filter(node => spoke.nodeIds.includes(node.id));
        const direct = groupBy === 'none';
        return (
          <g key={spoke.key}>
            {!direct && (
              <line
                x1={CX}
                y1={CY}
                x2={spoke.labelX}
                y2={spoke.labelY}
                stroke="var(--color-theme-border-default, #ccc)"
                strokeWidth={1}
                opacity={0.75}
              />
            )}
            {branchNodes.map(node => {
              const ax = direct ? CX : spoke.labelX;
              const ay = direct ? CY : spoke.labelY;
              const dx = node.x - ax;
              const dy = node.y - ay;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const nodePad = node.r + 3;
              const anchorPad = direct ? SOURCE_R + 2 : 14;
              return (
                <line
                  key={`edge-${node.id}`}
                  x1={ax + ux * anchorPad}
                  y1={ay + uy * anchorPad}
                  x2={node.x - ux * nodePad}
                  y2={node.y - uy * nodePad}
                  stroke="var(--color-theme-border-default, #ccc)"
                  strokeWidth={1}
                  opacity={0.6}
                />
              );
            })}
            {!direct && (
              <g>
                <rect
                  x={spoke.labelX - BRANCH_W / 2}
                  y={spoke.labelY - BRANCH_H / 2}
                  width={BRANCH_W}
                  height={BRANCH_H}
                  rx={4}
                  fill="var(--color-theme-surface-paper, #fff)"
                  stroke="var(--color-theme-border-primary, #e0d9c8)"
                  strokeWidth={1}
                />
                <text
                  x={spoke.labelX}
                  y={spoke.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-ink-secondary text-micro font-medium"
                >
                  {spoke.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
      <g>
        <circle
          cx={CX}
          cy={CY}
          r={SOURCE_R}
          fill={selfColor}
          stroke="var(--color-theme-ink, #111)"
          strokeWidth={1.5}
        />
        <title>{selfTitle}</title>
        <rect
          x={CX - sourceLabelW / 2}
          y={CY + SOURCE_R + 6}
          width={sourceLabelW}
          height={30}
          rx={4}
          fill="var(--color-theme-surface-paper, #fff)"
          stroke="var(--color-theme-border-primary, #e0d9c8)"
          strokeWidth={1}
        />
        <text
          x={CX}
          y={CY + SOURCE_R + 18}
          textAnchor="middle"
          className="fill-ink text-micro font-semibold"
        >
          {sourceLabel}
        </text>
        <text
          x={CX}
          y={CY + SOURCE_R + 30}
          textAnchor="middle"
          className="fill-ink-tertiary text-nano"
        >
          {selfTypeName}
        </text>
      </g>
      {nodes.map(node => (
        <g key={node.id}>
          <circle
            data-node="true"
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={node.color ?? '#9ca3af'}
            stroke={node.selected ? 'var(--color-theme-ink, #111)' : 'transparent'}
            strokeWidth={node.selected ? 2 : 0}
            opacity={0.9}
            className="cursor-pointer"
            onPointerEnter={e => onHover(e, node)}
            onPointerMove={e => onHover(e, node)}
            onPointerLeave={onHoverEnd}
            onClick={e => {
              e.stopPropagation();
              if (dragMoved()) return;
              const markerId = node.markerIds[0];
              if (markerId) onNodeClick(markerId);
            }}
          />
        </g>
      ))}
    </g>
  </svg>
);

export { RelationshipsGraphCanvas };
