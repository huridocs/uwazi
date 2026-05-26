import React, { useEffect, useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { ReferenceGroup } from '../groupReferences.js';
import { PageCount } from './PageCount.js';
import { PageLabel } from './PageLabel.js';

type PageModeProps = {
  markerLayerHeight: number;
  onPointClick?: (reference: EntityReference) => void;
  referencesGroups?: ReferenceGroup[];
  onMoreClick?: (references: EntityReference[]) => void;
  currentPage?: number;
};

const CLUSTER_MARKER_SIZE = 24;
const POINT_MARKER_SIZE = 10;
const TOP_RAIL_PADDING = 56;
const BOTTOM_RAIL_PADDING = 24;

const PageMode = ({
  markerLayerHeight,
  onPointClick,
  referencesGroups,
  onMoreClick,
  currentPage,
}: PageModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const hasCurrentPage = currentPage !== undefined;

  const pageClusters = useMemo(
    () =>
      currentPage === undefined
        ? referencesGroups
        : referencesGroups?.filter(reference => Number(reference.page) === currentPage),
    [currentPage, referencesGroups]
  );

  const { previousPageCount, nextPageCount } = useMemo(() => {
    if (currentPage === undefined || !referencesGroups?.length) {
      return { previousPageCount: 0, nextPageCount: 0 };
    }

    return referencesGroups.reduce(
      (acc, reference) => {
        const page = Number(reference.page);

        if (page < currentPage) {
          acc.previousPageCount += 1;
        } else if (page > currentPage) {
          acc.nextPageCount += 1;
        }

        return acc;
      },
      { previousPageCount: 0, nextPageCount: 0 }
    );
  }, [currentPage, referencesGroups]);

  useEffect(() => {
    const pageNumber = currentPage?.toString();

    if (!pageNumber) {
      setPageHeight(null);
      return undefined;
    }

    const pageElement = document.querySelector<HTMLDivElement>(
      `.page[data-page-number="${pageNumber}"]`
    );

    if (!pageElement) {
      // Warn users in case the way pages are represented changes since it will interfere with calculation for marker positions in page view.
      // eslint-disable-next-line no-console
      console.warn('Page element could not be found');
      setPageHeight(null);
      return undefined;
    }

    const updatePageHeight = () => {
      const { height } = pageElement.getBoundingClientRect();
      setPageHeight(height > 0 ? height : null);
    };

    updatePageHeight();

    const observer = new ResizeObserver(updatePageHeight);
    observer.observe(pageElement);

    return () => {
      observer.disconnect();
    };
  }, [currentPage]);

  const hasPreviousCount = hasCurrentPage && previousPageCount > 0;
  const hasNextCount = hasCurrentPage && nextPageCount > 0;
  const clusters = pageClusters ?? [];

  const getMarkerPosition = (top: number, index: number, markerSize: number) => {
    let ratio = 0.5;

    if (pageHeight) {
      ratio = top / pageHeight;
    } else if (clusters.length > 1) {
      ratio = index / (clusters.length - 1);
    }

    const railUsableHeight = markerLayerHeight - TOP_RAIL_PADDING - BOTTOM_RAIL_PADDING;

    return TOP_RAIL_PADDING + ratio * railUsableHeight - markerSize / 2;
  };

  return (
    <>
      {hasPreviousCount && (
        <div className="absolute top-0.5">
          <PageCount placement="top" count={previousPageCount} />
        </div>
      )}

      {hasCurrentPage && currentPage !== undefined && (
        <div className="absolute top-9">
          <PageLabel page={currentPage} />
        </div>
      )}

      {clusters.map((element, index) => {
        const key = `page-${element.page}-${element.top}-${index}`;
        const markerSize = element.type === 'cluster' ? CLUSTER_MARKER_SIZE : POINT_MARKER_SIZE;
        const position = getMarkerPosition(element.top, index, markerSize);

        if (element.type === 'cluster') {
          return (
            <Cluster
              key={key}
              position={position}
              references={element.references}
              isOpen={openClusterKey === key}
              onToggle={() => {
                setOpenClusterKey(currentValue => (currentValue === key ? null : key));
              }}
              onPointClick={reference => {
                onPointClick?.(reference);
              }}
              onMoreClick={references => {
                onMoreClick?.(references);
              }}
            />
          );
        }

        return (
          <Point
            key={key}
            position={position}
            reference={element.reference}
            onClick={reference => {
              setOpenClusterKey(null);
              onPointClick?.(reference);
            }}
          />
        );
      })}

      {hasNextCount && (
        <div className="absolute bottom-0.5">
          <PageCount placement="bottom" count={nextPageCount} />
        </div>
      )}
    </>
  );
};

export { PageMode };
