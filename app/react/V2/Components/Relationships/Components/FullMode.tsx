import React, { useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { FileType } from '#V2/api/entities/types.js';
import type { DocumentRelationshipGroup } from '../groupRelationships.js';
import { computeClusterOuterSize, computeMarkerY } from '../computeMarkerY.js';
import { RelationshipMarker } from '../types.js';

type FullModeProps = {
  document: FileType;
  markerLayerHeight: number;
  activeRelationshipId?: string | null;
  onPointClick?: (marker: RelationshipMarker) => void;
  onMoreClick?: (markers: RelationshipMarker[]) => void;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
  documentClusters?: DocumentRelationshipGroup[];
};

const POINT_MARKER_SIZE = 10;

const getMarkerTop = (marker: RelationshipMarker): number => {
  const selection = marker.anchor?.selections?.[0];
  return typeof selection?.top === 'number' ? selection.top : 0;
};

const FullMode = ({
  document,
  markerLayerHeight,
  activeRelationshipId = null,
  onPointClick,
  onMoreClick,
  onClusterClick,
  documentClusters,
}: FullModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const documentPages = document.totalPages ?? 1;

  const markers = useMemo(() => {
    const items =
      documentClusters?.map((element, index) => {
        const key = `doc-${element.startPage}-${element.endPage}-${index}`;
        const top = getMarkerTop(element.references[0]);
        const markerSize =
          element.type === 'cluster'
            ? computeClusterOuterSize(element.references.length)
            : POINT_MARKER_SIZE;
        const position = computeMarkerY({
          mode: 'full',
          layerHeight: markerLayerHeight,
          page: element.page,
          top,
          totalPages: documentPages,
          markerSize,
        });
        return { key, element, position };
      }) ?? [];

    return items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, stackOrder: index + 1 }));
  }, [documentClusters, documentPages, markerLayerHeight]);

  return markers.map(({ key, element, position, stackOrder }) => {
    if (element.type === 'cluster') {
      return (
        <Cluster
          key={key}
          position={position}
          stackOrder={stackOrder}
          references={element.references}
          activePointId={activeRelationshipId}
          isOpen={openClusterKey === key}
          onToggle={() => {
            setOpenClusterKey(currentValue => (currentValue === key ? null : key));
          }}
          onPointClick={reference => {
            onPointClick?.(reference);
          }}
          onMoreClick={references => onMoreClick?.(references)}
          onClusterClick={references => {
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
        marker={element.references[0]}
        isActive={activeRelationshipId === element.references[0]._id}
        onClick={marker => {
          setOpenClusterKey(null);
          onPointClick?.(marker);
        }}
      />
    );
  });
};

export { FullMode };
