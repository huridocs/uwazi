import React, { useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { ReferenceGroup } from '../groupReferences.js';
import { PageCount } from './PageCount.js';
import { PageLabel } from './PageLabel.js';
import { computeMarkerY } from '../computeMarkerY.js';
import type { ReferenceWithTemplate } from '../types.js';

type PageModeProps = {
  markerLayerHeight: number;
  onPointClick?: (reference: EntityReference) => void;
  referencesGroups?: ReferenceGroup[];
  references?: ReferenceWithTemplate[];
  onMoreClick?: (references: EntityReference[]) => void;
  currentPage?: number;
  pageHeight?: number;
};

const CLUSTER_MARKER_SIZE = 24;
const POINT_MARKER_SIZE = 10;

const getGroupReferences = (group: ReferenceGroup): EntityReference[] =>
  group.type === 'cluster' ? group.references : [group.reference];

const PageMode = ({
  markerLayerHeight,
  onPointClick,
  referencesGroups,
  references,
  onMoreClick,
  currentPage,
  pageHeight,
}: PageModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const hasCurrentPage = currentPage !== undefined;

  const pageClusters = useMemo(
    () =>
      currentPage === undefined
        ? referencesGroups
        : referencesGroups?.filter(reference => Number(reference.page) === currentPage),
    [currentPage, referencesGroups]
  );

  const { previousPageCount, nextPageCount, previousColors, nextColors } = useMemo(() => {
    if (currentPage === undefined || !referencesGroups?.length) {
      return { previousPageCount: 0, nextPageCount: 0, previousColors: [], nextColors: [] };
    }

    const beforeColors: string[] = [];
    const afterColors: string[] = [];

    const counts = referencesGroups.reduce(
      (acc, group) => {
        const page = Number(group.page);
        const groupRefs = getGroupReferences(group);

        groupRefs.forEach(ref => {
          const color =
            references?.find(r => r._id === ref._id)?.targetEntity.template.color ?? '#A4CAFE';

          if (page < currentPage) {
            acc.previousPageCount += 1;
            if (beforeColors.length < 4 && !beforeColors.includes(color)) {
              beforeColors.push(color);
            }
          } else if (page > currentPage) {
            acc.nextPageCount += 1;
            if (afterColors.length < 4 && !afterColors.includes(color)) {
              afterColors.push(color);
            }
          }
        });

        return acc;
      },
      { previousPageCount: 0, nextPageCount: 0 }
    );

    return { ...counts, previousColors: beforeColors, nextColors: afterColors };
  }, [currentPage, referencesGroups, references]);

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
      const markerSize = element.type === 'cluster' ? CLUSTER_MARKER_SIZE : POINT_MARKER_SIZE;
      const position = getMarkerPosition(element.top, markerSize);
      const trackRatio =
        markerLayerHeight > 0 ? (position + markerSize / 2) / markerLayerHeight : 0.5;

      return { key, element, position, trackRatio };
    });

    return items
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, stackOrder: index + 1 }));
  }, [pageClusters, markerLayerHeight, currentPage, pageHeight]);

  return (
    <>
      {hasPreviousCount && (
        <div className="absolute top-0.5">
          <PageCount placement="top" count={previousPageCount} colors={previousColors} />
        </div>
      )}

      {hasCurrentPage && <PageLabel page={currentPage} markerLayerHeight={markerLayerHeight} />}

      {markers.map(({ key, element, position, trackRatio, stackOrder }) => {
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
              onMoreClick={refs => onMoreClick?.(refs)}
            />
          );
        }

        return (
          <Point
            key={key}
            position={position}
            stackOrder={stackOrder}
            reference={element.reference}
            isActive={activePointId === element.reference._id}
            onClick={reference => {
              setActivePointId(reference._id);
              setOpenClusterKey(null);
              onPointClick?.(reference);
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
