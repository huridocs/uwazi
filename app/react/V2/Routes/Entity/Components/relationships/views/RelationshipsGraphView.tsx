import React, { useMemo, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  buildGraphLayout,
  computeFitTransform,
  GRAPH_CAP,
  sourcePillWidth,
  truncateForFit,
} from '#V2/formatters/relationships/relationshipsPanelGraph.js';
import type { GroupLabelContext } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { RelationshipsEmptyView } from '../panel/RelationshipsEmptyView.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsGraphCanvas } from './RelationshipsGraphCanvas.js';
import { RelationshipsGraphZoomControls } from './RelationshipsGraphZoomControls.js';
import { useGraphPanZoom } from './useGraphPanZoom.js';

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

const RelationshipsGraphView = ({
  markers,
  groupContext,
  activeRelationshipId,
  onNodeClick,
}: RelationshipsGraphViewProps) => {
  const { groupBy } = useRelationshipsPanelLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<GraphHover | null>(null);

  const { selfTitle } = groupContext;
  const selfTypeName = groupContext.templateName(groupContext.selfTemplateId);
  const selfColor = groupContext.templateColor(groupContext.selfTemplateId) ?? '#9ca3af';
  const sourceLabel = truncateForFit(selfTitle, 26);
  const sourceLabelW = sourcePillWidth(selfTitle, selfTypeName);

  const { spokes, nodes, truncated } = useMemo(
    () => buildGraphLayout(markers, groupBy, groupContext, activeRelationshipId),
    [markers, groupBy, groupContext, activeRelationshipId]
  );
  const fit = useMemo(
    () => computeFitTransform(nodes, spokes, selfTitle, selfTypeName),
    [nodes, spokes, selfTitle, selfTypeName]
  );
  const fitKey = `${nodes.map(node => node.id).join('|')}::${spokes.map(spoke => spoke.key).join('|')}`;
  const {
    transform,
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    zoomIn,
    zoomOut,
    reset,
  } = useGraphPanZoom(fit, fitKey);

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
    <div ref={containerRef} className="relative h-full min-h-0 overflow-hidden bg-warm">
      {truncated > 0 && (
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-border bg-paper/90 px-3 py-1 text-micro text-ink-tertiary shadow-sm">
          <Translate>Showing the top</Translate> {GRAPH_CAP} <Translate>of</Translate>{' '}
          {(GRAPH_CAP + truncated).toLocaleString()} <Translate>relationships</Translate>
        </div>
      )}
      <RelationshipsGraphZoomControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
      />
      <RelationshipsGraphCanvas
        spokes={spokes}
        nodes={nodes}
        groupBy={groupBy}
        transform={transform}
        selfTitle={selfTitle}
        selfTypeName={selfTypeName}
        selfColor={selfColor}
        sourceLabel={sourceLabel}
        sourceLabelW={sourceLabelW}
        dragMoved={() => dragRef.current.moved}
        onNodeClick={onNodeClick}
        onHover={setHoverFromEvent}
        onHoverEnd={() => setHover(null)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
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
