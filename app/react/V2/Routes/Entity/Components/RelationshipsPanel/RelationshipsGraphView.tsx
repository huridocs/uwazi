import React, { useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildGraphLayout,
  CX,
  CY,
  SOURCE_R,
  VIEW_H,
  VIEW_W,
} from '#V2/formatters/relationships/relationshipsPanelGraph.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { relationshipsPanelGroupByAtom } from './relationshipsPanelFiltersAtom.js';

type RelationshipsGraphViewProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfSharedId: string;
  selfTitle: string;
  activeRelationshipId?: string;
  onNodeClick: (markerId: string) => void;
};

const RelationshipsGraphView = ({
  markers,
  groupContext,
  selfSharedId,
  selfTitle,
  activeRelationshipId,
  onNodeClick,
}: RelationshipsGraphViewProps) => {
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, initTx: 0, initTy: 0 });

  const { spokes, nodes } = useMemo(
    () => buildGraphLayout(markers, selfSharedId, groupBy, groupContext, activeRelationshipId),
    [markers, selfSharedId, groupBy, groupContext, activeRelationshipId]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-warm py-16">
        <LinkIcon className="mb-3 h-9 w-9 text-ink-tertiary/40" />
        <p className="text-sm text-ink-tertiary">
          <Translate>No relationships to graph</Translate>
        </p>
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).dataset.node) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initTx: transform.tx,
      initTy: transform.ty,
    };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform(current => ({
      ...current,
      tx: dragRef.current.initTx + dx,
      ty: dragRef.current.initTy + dy,
    }));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current.active = false;
  };

  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden bg-warm">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
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
                  const startX = direct ? CX : spoke.labelX;
                  const startY = direct ? CY : spoke.labelY;
                  return (
                    <line
                      key={`edge-${node.id}`}
                      x1={startX}
                      y1={startY}
                      x2={node.x}
                      y2={node.y}
                      stroke="var(--color-theme-border-default, #ccc)"
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  );
                })}
                {!direct && (
                  <text
                    x={spoke.labelX}
                    y={spoke.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-ink-secondary text-[11px] font-medium"
                  >
                    {spoke.label}
                  </text>
                )}
              </g>
            );
          })}
          <circle
            cx={CX}
            cy={CY}
            r={SOURCE_R}
            fill="var(--color-theme-surface-paper, #fff)"
            stroke="var(--color-theme-border-default, #ccc)"
            strokeWidth={2}
          />
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-ink text-[10px] font-semibold"
          >
            {selfTitle.length > 14 ? `${selfTitle.slice(0, 12)}…` : selfTitle}
          </text>
          {nodes.map(node => (
            <g
              key={node.id}
              data-node="true"
              className="cursor-pointer"
              onClick={() => {
                const markerId = node.markerIds[0];
                if (markerId) onNodeClick(markerId);
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.color ?? '#9ca3af'}
                stroke={node.selected ? 'var(--color-theme-ink, #111)' : 'transparent'}
                strokeWidth={node.selected ? 2 : 0}
                opacity={0.9}
              />
              <title>{`${node.title} (${node.evidenceCount})`}</title>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export { RelationshipsGraphView };
