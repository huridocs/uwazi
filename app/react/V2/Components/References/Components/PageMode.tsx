import React, { useEffect, useMemo, useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { ReferenceGroup } from '../groupReferences.js';

type PageModeProps = {
  markerLayerHeight: number;
  onPointClick?: (reference: EntityReference) => void;
  referencesGroups?: ReferenceGroup[];
  currentPage?: number;
};

const CLUSTER_MARKER_SIZE = 24;
const POINT_MARKER_SIZE = 10;
const RAIL_PADDING = 8;

const clampToRail = (position: number, markerSize: number, markerLayerHeight: number) =>
  Math.min(Math.max(position, 0), Math.max(markerLayerHeight - markerSize, 0));

const PageMode = ({
  markerLayerHeight,
  onPointClick,
  referencesGroups,
  currentPage,
}: PageModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  const pageClusters = useMemo(
    () =>
      currentPage === undefined
        ? referencesGroups
        : referencesGroups?.filter(reference => Number(reference.page) === currentPage),
    [currentPage, referencesGroups]
  );

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
      // Warn users in case the way pages are represented changes.
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

  const getEvenlySpacedPosition = (index: number, total: number, markerSize: number) => {
    const usableHeight = Math.max(markerLayerHeight - RAIL_PADDING * 2, 0);
    const slot = total <= 1 ? 0.5 : index / (total - 1);
    return clampToRail(
      RAIL_PADDING + slot * usableHeight - markerSize / 2,
      markerSize,
      markerLayerHeight
    );
  };

  const getProportionalPosition = (top: number, markerSize: number) => {
    const ratio = pageHeight ? top / pageHeight : 0;
    return clampToRail(ratio * markerLayerHeight, markerSize, markerLayerHeight);
  };

  return (pageClusters ?? []).map((element, index) => {
    const key = `page-${element.page}-${element.top}-${index}`;
    const markerSize = element.type === 'cluster' ? CLUSTER_MARKER_SIZE : POINT_MARKER_SIZE;
    const position = pageHeight
      ? getProportionalPosition(element.top, markerSize)
      : getEvenlySpacedPosition(index, (pageClusters ?? []).length, markerSize);

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
  });
};

export { PageMode };
