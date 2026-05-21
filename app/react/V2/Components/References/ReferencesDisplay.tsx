import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Square3Stack3DIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { formatReferences } from '#V2/formatters/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { Cluster, Point } from './Components/index.js';
import { groupReferences, groupDocumentReferences } from './groupReferences.js';

type ReferencesDisplayProps = {
  entity: Entity;
  document: FileType;
  currentPage?: number;
  onPointClick?: (reference: EntityReference) => void;
};

const ReferencesDisplay = ({
  entity,
  document,
  currentPage,
  onPointClick,
}: ReferencesDisplayProps) => {
  const [fullMode, setFullMode] = useState(true);
  const markerLayerRef = useRef<HTMLDivElement>(null);
  const [markerLayerHeight, setMarkerLayerHeight] = useState(0);

  useEffect(() => {
    const markerLayerElement = markerLayerRef.current;

    if (!markerLayerElement) {
      return undefined;
    }

    const updateHeight = () => {
      setMarkerLayerHeight(markerLayerElement.clientHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(markerLayerElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const referencesGroups = useMemo(() => groupReferences(formatReferences(entity)), [entity]);

  const documentClusters = useMemo(
    () => groupDocumentReferences(referencesGroups, document.totalPages),
    [document, referencesGroups]
  );

  const pageClusters = useMemo(
    () =>
      currentPage === undefined
        ? referencesGroups
        : referencesGroups.filter(reference => Number.parseInt(reference.page, 10) === currentPage),
    [currentPage, referencesGroups]
  );

  return (
    <div className="w-full h-full flex flex-col gap-2 items-center px-4">
      <button
        type="button"
        onClick={() => {
          setFullMode(!fullMode);
        }}
        className="cursor-pointer"
      >
        <Translate className="sr-only">Toggle timeline mode</Translate>
        {fullMode ? (
          <Square3Stack3DIcon className="w-4 h-4" />
        ) : (
          <DocumentIcon className="w-4 h-4" />
        )}
      </button>
      <div className="h-full w-4 flex flex-col items-center relative">
        <div className="h-full w-0.5 bg-(--color-theme-border-soft)" />
        <div ref={markerLayerRef} className="absolute inset-0 flex flex-col items-center">
          {fullMode
            ? documentClusters.map((element, index) => {
                const key = `doc-${element.startPage}-${element.endPage}-${index}`;
                const position = element.position * markerLayerHeight;

                if (element.type === 'cluster') {
                  return (
                    <Cluster
                      key={key}
                      position={position}
                      references={element.references}
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
                    reference={element.references[0]}
                    onClick={reference => {
                      onPointClick?.(reference);
                    }}
                  />
                );
              })
            : pageClusters.map((element, index) => {
                const key = `page-${element.page}-${element.top}-${index}`;

                if (element.type === 'cluster') {
                  return (
                    <Cluster
                      key={key}
                      position={element.top}
                      references={element.references}
                      onPointClick={reference => {
                        onPointClick?.(reference);
                      }}
                    />
                  );
                }

                return (
                  <Point
                    key={key}
                    position={element.top}
                    reference={element.reference}
                    onClick={reference => {
                      onPointClick?.(reference);
                    }}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
};

export { ReferencesDisplay };
