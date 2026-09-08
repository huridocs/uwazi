import React, { useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { FileType } from '#V2/api/entities/types.js';
import type { DocumentRelationshipGroup } from '../groupRelationships.js';
import { computeFullRailMarkerLayout } from '../computeMarkerY.js';
import { RelationshipMarker, markerTop } from '../types.js';

type FullModeProps = {
  document: FileType;
  markerLayerHeight: number;
  activeRelationshipId?: string | null;
  onPointClick?: (marker: RelationshipMarker) => void;
  onPointHover?: (marker: RelationshipMarker) => void;
  onMoreClick?: (markers: RelationshipMarker[]) => void;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
  onClusterHover?: (markers: RelationshipMarker[]) => void;
  documentClusters?: DocumentRelationshipGroup[];
};

const FullModeComponent = ({
  document,
  markerLayerHeight,
  activeRelationshipId = null,
  onPointClick,
  onPointHover,
  onMoreClick,
  onClusterClick,
  onClusterHover,
  documentClusters,
}: FullModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const documentPages = document.totalPages ?? 1;

  const markers = useMemo(() => {
    const items =
      documentClusters?.map((element, index) => {
        const key = `doc-${element.startPage}-${element.endPage}-${index}`;
        const { y: position } = computeFullRailMarkerLayout({
          layerHeight: markerLayerHeight,
          page: element.page,
          top: markerTop(element.references[0]),
          totalPages: documentPages,
          type: element.type,
          referenceCount: element.references.length,
        });
        return { key, element, position };
      }) ?? [];

    return items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, stackOrder: index + 1 }));
  }, [documentClusters, documentPages, markerLayerHeight]);

  return (
    <>
      {markers.map(({ key, element, position, stackOrder }) => {
        if (element.type === 'cluster') {
          return (
            <Cluster
              key={key}
              position={position}
              markerLayerHeight={markerLayerHeight}
              stackOrder={stackOrder}
              references={element.references}
              activePointId={activeRelationshipId}
              isOpen={openClusterKey === key}
              onToggle={() => {
                setOpenClusterKey(currentValue => (currentValue === key ? null : key));
              }}
              onPointClick={reference => onPointClick?.(reference)}
              onPointHover={onPointHover}
              onMoreClick={references => onMoreClick?.(references)}
              onClusterClick={references => onClusterClick?.(references)}
              onClusterHover={onClusterHover}
            />
          );
        }

        return (
          <Point
            key={key}
            position={position}
            stackOrder={stackOrder}
            centerOnAxis
            marker={element.references[0]}
            isActive={activeRelationshipId === element.references[0]._id}
            onClick={marker => {
              setOpenClusterKey(null);
              onPointClick?.(marker);
            }}
            onHover={onPointHover}
          />
        );
      })}
    </>
  );
};

const FullMode = React.memo(FullModeComponent);

export { FullMode };
