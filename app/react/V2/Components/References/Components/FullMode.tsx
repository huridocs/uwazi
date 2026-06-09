import React, { useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { FileType } from '#V2/api/entities/types.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { DocumentReferenceGroup } from '../groupReferences.js';
import { computeMarkerY } from '../computeMarkerY.js';

type FullModeProps = {
  document: FileType;
  markerLayerHeight: number;
  pageHeight?: number;
  onPointClick?: (reference: EntityReference) => void;
  onMoreClick?: (references: EntityReference[]) => void;
  onClusterClick?: (references: EntityReference[]) => void;
  documentClusters?: DocumentReferenceGroup[];
};

const CLUSTER_MARKER_SIZE = 24;
const POINT_MARKER_SIZE = 10;

const getReferenceTop = (reference: EntityReference): number => {
  const rect = reference.reference.selectionRectangles?.[0];
  return typeof rect?.top === 'number' ? rect.top : 0;
};

const FullMode = ({
  document,
  markerLayerHeight,
  pageHeight,
  onPointClick,
  onMoreClick,
  onClusterClick,
  documentClusters,
}: FullModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const documentPages = document.totalPages ?? 1;

  const markers = useMemo(() => {
    const items =
      documentClusters?.map((element, index) => {
        const key = `doc-${element.startPage}-${element.endPage}-${index}`;
        const top = getReferenceTop(element.references[0]);
        const markerSize = element.type === 'cluster' ? CLUSTER_MARKER_SIZE : POINT_MARKER_SIZE;
        const position = computeMarkerY({
          mode: 'full',
          layerHeight: markerLayerHeight,
          page: element.page,
          top,
          totalPages: documentPages,
          markerSize,
          pageHeight,
        });
        const trackRatio =
          markerLayerHeight > 0 ? (position + markerSize / 2) / markerLayerHeight : 0.5;

        return { key, element, position, trackRatio };
      }) ?? [];

    return items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, stackOrder: index + 1 }));
  }, [documentClusters, documentPages, markerLayerHeight, pageHeight]);

  return markers.map(({ key, element, position, trackRatio, stackOrder }) => {
    if (element.type === 'cluster') {
      return (
        <Cluster
          key={key}
          position={position}
          stackOrder={stackOrder}
          trackRatio={trackRatio}
          references={element.references}
          activePointId={activePointId}
          isOpen={openClusterKey === key}
          onToggle={() => {
            setActivePointId(null);
            setOpenClusterKey(currentValue => (currentValue === key ? null : key));
          }}
          onPointClick={reference => {
            setActivePointId(reference._id);
            onPointClick?.(reference);
          }}
          onMoreClick={references => onMoreClick?.(references)}
          onClusterClick={references => {
            setActivePointId(null);
            onClusterClick?.(references);
          }}
        />
      );
    }

    return (
      <Point
        key={key}
        position={position}
        stackOrder={stackOrder}
        reference={element.references[0]}
        isActive={activePointId === element.references[0]._id}
        onClick={reference => {
          setActivePointId(reference._id);
          setOpenClusterKey(null);
          onPointClick?.(reference);
        }}
      />
    );
  });
};

export { FullMode };
