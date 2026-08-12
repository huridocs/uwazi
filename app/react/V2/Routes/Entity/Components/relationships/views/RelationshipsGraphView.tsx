import React, { useMemo, useRef, useState } from 'react';
import { Translate, t } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildGraphLayout,
  CX,
  CY,
  GRAPH_CAP,
  SOURCE_R,
  sourcePillWidth,
  truncateForFit,
  VIEW_H,
  VIEW_W,
} from '#V2/formatters/relationships/relationshipsPanelGraph.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsEmptyView } from '../panel/RelationshipsEmptyView.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

type RelationshipsGraphViewProps = {
  markers: RelationshipMarker[];
  groupContext: GroupLabelContext;
  activeRelationshipId?: string;
  onNodeClick: (markerId: string) => void;
};

type GraphHover = {
  title: string;
  typeName: string;
  evidenceCount: number;
  x: number;
  y: number;
};

const STEP = 0.25;
const BRANCH_W = 110;
const BRANCH_H = 22;
const IDENTITY = { tx: 0, ty: 0, scale: 1 };

const RelationshipsGraphView = ({
  markers,
  groupContext,
  activeRelationshipId,
  onNodeClick,
}: RelationshipsGraphViewProps) => {
  const { groupBy } = useRelationshipsPanelLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState(IDENTITY);
  const [hover, setHover] = useState<GraphHover | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    initTx: 0,
    initTy: 0,
    moved: false,
  });

  const selfTitle = groupContext.selfTitle;
  const selfTypeName = groupContext.templateName(groupContext.selfTemplateId);
  const selfColor = groupContext.templateColor(groupContext.selfTemplateId) ?? '#9ca3af';
  const sourceLabel = truncateForFit(selfTitle, 26);
  const sourceLabelW = sourcePillWidth(selfTitle, selfTypeName);

  const { spokes, nodes, truncated } = useMemo(
    () => buildGraphLayout(markers, groupBy, groupContext, activeRelationshipId),
    [markers, groupBy, groupContext, activeRelationshipId]
  );

  if (nodes.length === 0) {
    return (
      <RelationshipsEmptyView className="flex-1 bg-warm py-16">
        <Translate>No relationships to graph</Translate>
      </RelationshipsEmptyView>
    );
  }

  const setHoverFromEvent = (
    e: React.PointerEvent,
    node: { title: string; typeName: string; evidenceCount: number }
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({
      title: node.title,
      typeName: node.typeName,
      evidenceCount: node.evidenceCount,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).dataset.node) {
      dragRef.current.moved = false;
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initTx: transform.tx,
      initTy: transform.ty,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) > 3) dragRef.current.moved = true;
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
  const reset = () => setTransform(IDENTITY);

  const tooltipStyle = (() => {
    if (!hover || !containerRef.current) return undefined;
    const rect = containerRef.current.getBoundingClientRect();
    const estWidth = Math.min(240, Math.max(140, hover.title.length * 7 + 24));
    const estHeight = 44;
    const pad = 8;
    return {
      left: Math.min(rect.width - estWidth - pad, Math.max(pad, hover.x + 12)),
      top: Math.min(rect.height - estHeight - pad, Math.max(pad, hover.y - estHeight - 10)),
    };
  })();

  return (
    <div ref={containerRef} className="relative min-h-[320px] flex-1 overflow-hidden bg-warm">
      {truncated > 0 && (
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-border bg-paper/90 px-3 py-1 text-micro text-ink-tertiary shadow-sm">
          <Translate>Showing the top</Translate> {GRAPH_CAP} <Translate>of</Translate>{' '}
          {(GRAPH_CAP + truncated).toLocaleString()} <Translate>relationships</Translate>
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md border border-border bg-paper px-1 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          aria-label={t('System', 'Zoom out', null, false)}
          onClick={zoomOut}
          className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink hover:bg-gray-100"
        >
          −
        </button>
        <span className="min-w-[3.5ch] text-center text-tab font-medium text-ink-secondary">
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
                onPointerEnter={e => setHoverFromEvent(e, node)}
                onPointerMove={e => setHoverFromEvent(e, node)}
                onPointerLeave={() => setHover(null)}
                onClick={e => {
                  e.stopPropagation();
                  if (dragRef.current.moved) return;
                  const markerId = node.markerIds[0];
                  if (markerId) onNodeClick(markerId);
                }}
              />
            </g>
          ))}
        </g>
      </svg>
      {hover && tooltipStyle && (
        <div
          className="pointer-events-none absolute z-10 max-w-60 rounded-md bg-ink px-2.5 py-1.5 text-parchment shadow-md opacity-95"
          style={tooltipStyle}
        >
          <div className="truncate text-micro font-semibold">{hover.title}</div>
          <div className="truncate text-nano opacity-80">
            {hover.typeName} · {hover.evidenceCount} <Translate>evidence</Translate>
          </div>
        </div>
      )}
    </div>
  );
};

export { RelationshipsGraphView };
