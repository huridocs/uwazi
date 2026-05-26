import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Square3Stack3DIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { formatReferences } from '#V2/formatters/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { groupReferences, groupDocumentReferences } from './groupReferences.js';
import { FullMode, PageMode } from './Components/index.js';

type ReferencesDisplayProps = {
  entity: Entity;
  document: FileType;
  currentPage?: number;
  onPointClick?: (reference: EntityReference) => void;
  onClusterClick?: (references: EntityReference[]) => void;
};

const ReferencesDisplay = ({
  entity,
  document,
  currentPage,
  onPointClick,
  onClusterClick,
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
    () => groupDocumentReferences(referencesGroups, document.totalPages ?? 1),
    [document.totalPages, referencesGroups]
  );

  return (
    <div className="w-full h-full flex flex-col gap-2 items-center px-4 text-ink-tertiary">
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
        <div className="h-full w-0.5 bg-(--color-theme-border-default)" />
        <div ref={markerLayerRef} className="absolute inset-0 flex flex-col items-center">
          {fullMode ? (
            <FullMode
              document={document}
              markerLayerHeight={markerLayerHeight}
              documentClusters={documentClusters}
              onPointClick={onPointClick}
              onClusterClick={onClusterClick}
            />
          ) : (
            <PageMode
              markerLayerHeight={markerLayerHeight}
              referencesGroups={referencesGroups}
              currentPage={currentPage}
              onPointClick={onPointClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { ReferencesDisplay };
