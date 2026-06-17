import React, { useMemo, useRef, useState } from 'react';
import { Translate, t } from '#app/I18N/index.js';
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
import { RelationshipsEmptyView } from '../panel/RelationshipsEmptyView.js';
import { useRelationshipsPanelFilters } from '../../context/EntityScopedProvider.js';

type RelationshipsGraphViewProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  selfSharedId: string;
  selfTitle: string;
  activeRelationshipId?: string;
  onNodeClick: (markerId: string) => void;
};

const STEP = 0.25;

const RelationshipsGraphView = ({
  markers,
  groupContext,
  selfSharedId,
  selfTitle,
  activeRelationshipId,
  onNodeClick,
}: RelationshipsGraphViewProps) => {
  const { groupBy } = useRelationshipsPanelFilters();
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, initTx: 0, initTy: 0 });

  const { spokes, nodes } = useMemo(
    () => buildGraphLayout(markers, selfSharedId, groupBy, groupContext, activeRelationshipId),
    [markers, selfSharedId, groupBy, groupContext, activeRelationshipId]
  );

  if (nodes.length === 0) {
    return (
      <RelationshipsEmptyView className="flex-1 bg-warm py-16">
        <Translate>No relationships to graph</Translate>
      </RelationshipsEmptyView>
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

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP;
    setTransform(current => ({
      ...current,
      scale: Math.min(Math.max(current.scale + delta, 0.25), 4),
    }));
  };

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + STEP, 4) }));
  const zoomOut = () =>
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - STEP, 0.25) }));
  const reset = () => setTransform({ tx: 0, ty: 0, scale: 1 });

  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden bg-warm">
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md border border-border bg-paper px-1 py-0.5 shadow-sm">
        <button
          type="button"
          aria-label={t('System', 'Zoom out', null, false)}
          onClick={zoomOut}
          className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink hover:bg-gray-100"
        >
          −
        </button>
        <span className="min-w-[3.5ch] text-center text-xs text-ink-secondary">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          type="button"
          aria-label={t('System', 'Zoom in', null, false)}
          onClick={zoomIn}
          className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink hover:bg-gray-100"
        >
          +
        </button>
        <button
          type="button"
          onClick={reset}
          className="ml-1 text-xs text-ink-light hover:text-ink"
        >
          <Translate>Reset</Translate>
        </button>
      </div>
      <svg
        ref={svgRef}
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
