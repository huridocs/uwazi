import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { RelationshipGroup } from '../groupRelationships.js';
import { PageCount } from './PageCount.js';
import { PageLabel } from './PageLabel.js';
import { computeClusterOuterSize, computeMarkerY } from '../computeMarkerY.js';
import { RelationshipMarker } from '../types.js';

type PageModeProps = {
  markerLayerHeight: number;
  onPointClick?: (marker: RelationshipMarker) => void;
  relationshipGroups?: RelationshipGroup[];
  activeRelationshipId?: string | null;
  onMoreClick?: (markers: RelationshipMarker[]) => void;
  currentPage?: number;
  pageHeight?: number;
};

const POINT_MARKER_SIZE = 10;
const DEFAULT_COLOR = '#A4CAFE';

const getGroupMarkers = (group: RelationshipGroup): RelationshipMarker[] =>
  group.type === 'cluster' ? group.references : [group.reference];

const PageMode = ({
  markerLayerHeight,
  onPointClick,
  relationshipGroups,
  activeRelationshipId = null,
  onMoreClick,
  currentPage,
  pageHeight,
}: PageModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const templates = useAtomValue(templatesAtom);
  const hasCurrentPage = currentPage !== undefined;

  const colorOf = (marker: RelationshipMarker): string =>
    templates.find(template => template._id === marker.target.templateId)?.color ?? DEFAULT_COLOR;

  const pageClusters = useMemo(
    () =>
      currentPage === undefined
        ? relationshipGroups
        : relationshipGroups?.filter(group => Number(group.page) === currentPage),
    [currentPage, relationshipGroups]
  );

  const { previousPageCount, nextPageCount, previousColors, nextColors } = useMemo(() => {
    if (currentPage === undefined || !relationshipGroups?.length) {
      return { previousPageCount: 0, nextPageCount: 0, previousColors: [], nextColors: [] };
    }

    const beforeColors: string[] = [];
    const afterColors: string[] = [];

    const counts = relationshipGroups.reduce(
      (acc, group) => {
        const page = Number(group.page);
        getGroupMarkers(group).forEach(marker => {
          const color = colorOf(marker);
          if (page < currentPage) {
            acc.previousPageCount += 1;
            if (beforeColors.length < 4 && !beforeColors.includes(color)) beforeColors.push(color);
          } else if (page > currentPage) {
            acc.nextPageCount += 1;
            if (afterColors.length < 4 && !afterColors.includes(color)) afterColors.push(color);
          }
        });
        return acc;
      },
      { previousPageCount: 0, nextPageCount: 0 }
    );

    return { ...counts, previousColors: beforeColors, nextColors: afterColors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, relationshipGroups, templates]);

  const hasPreviousCount = hasCurrentPage && previousPageCount > 0;
  const hasNextCount = hasCurrentPage && nextPageCount > 0;
  const getMarkerPosition = (top: number, markerSize: number) =>
    computeMarkerY({
      mode: 'page',
      layerHeight: markerLayerHeight,
      page: currentPage ?? 1,
      top,
      totalPages: 1,
      markerSize,
      pageHeight,
    });

  const markers = useMemo(() => {
    const items = (pageClusters ?? []).map((element, index) => {
      const key = `page-${element.page}-${element.top}-${index}`;
      const markerSize =
        element.type === 'cluster'
          ? computeClusterOuterSize(element.references.length)
          : POINT_MARKER_SIZE;
      const position = getMarkerPosition(element.top, markerSize);
      return { key, element, position };
    });

    return items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, stackOrder: index + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageClusters, markerLayerHeight, currentPage, pageHeight]);

  return (
    <>
      {hasPreviousCount && (
        <div className="absolute top-0.5">
          <PageCount placement="top" count={previousPageCount} colors={previousColors} />
        </div>
      )}

      {hasCurrentPage && <PageLabel page={currentPage} markerLayerHeight={markerLayerHeight} />}

      {markers.map(({ key, element, position, stackOrder }) => {
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
              onPointClick={marker => {
                onPointClick?.(marker);
              }}
              onMoreClick={markersToShow => onMoreClick?.(markersToShow)}
            />
          );
        }

        return (
          <Point
            key={key}
            position={position}
            stackOrder={stackOrder}
            marker={element.reference}
            isActive={activeRelationshipId === element.reference._id}
            onClick={marker => {
              setOpenClusterKey(null);
              onPointClick?.(marker);
            }}
          />
        );
      })}

      {hasNextCount && (
        <div className="absolute bottom-0.5">
          <PageCount placement="bottom" count={nextPageCount} colors={nextColors} />
        </div>
      )}
    </>
  );
};

export { PageMode };
