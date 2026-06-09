import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Square3Stack3DIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import throttle from 'lodash/throttle.js';
import { Translate } from '#app/I18N/index.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { formatReferences } from '#V2/formatters/index.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { groupReferences, groupDocumentReferences } from './groupReferences.js';
import { FullMode, PageMode } from './Components/index.js';
import type { ReferenceWithTemplate } from './types.js';

const RAIL_LAYOUT = {
  insetTop: 8,
  insetBottom: 8,
  insetRight: 16,
  width: 32,
  trackTopBelowToggle: 28,
} as const;

type ReferencesDisplayProps = {
  entity: Entity;
  document: FileType;
  currentPage?: number;
  pageHeight?: number;
  showRail?: boolean;
  onPointClick?: (reference: EntityReference) => void;
  onClusterClick?: (references: EntityReference[]) => void;
};

const ReferencesDisplay = ({
  entity,
  document,
  currentPage,
  pageHeight,
  showRail = true,
  onPointClick,
  onClusterClick,
}: ReferencesDisplayProps) => {
  const templates = useAtomValue(templatesAtom);
  const [fullMode, setFullMode] = useState(true);
  const markerLayerRef = useRef<HTMLDivElement>(null);
  const [markerLayerHeight, setMarkerLayerHeight] = useState(0);

  const references = useMemo<ReferenceWithTemplate[]>(
    () =>
      formatReferences(entity).map(ref => {
        const template = templates.find(t => t._id === ref.targetEntity.templateId);
        return {
          ...ref,
          targetEntity: {
            ...ref.targetEntity,
            template: {
              _id: ref.targetEntity.templateId,
              name: template?.name || '',
              color: template?.color || '#A4CAFE',
            },
          },
        };
      }),
    [entity, templates]
  );

  const referencesGroups = useMemo(
    () => groupReferences(references, { trackHeight: markerLayerHeight, pageHeight }),
    [references, markerLayerHeight, pageHeight]
  );

  const documentClusters = useMemo(
    () => groupDocumentReferences(referencesGroups, document.totalPages ?? 1),
    [document.totalPages, referencesGroups]
  );

  useEffect(() => {
    const markerLayerElement = markerLayerRef.current;

    if (!markerLayerElement) {
      return undefined;
    }

    const updateHeight = throttle(() => {
      setMarkerLayerHeight(markerLayerElement.clientHeight);
    }, 100);

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(markerLayerElement);

    return () => {
      observer.disconnect();
      updateHeight.cancel();
    };
  }, [showRail, fullMode]);

  if (!showRail) {
    return null;
  }

  const rootClass =
    'pointer-events-none flex h-full min-h-0 flex-col items-center text-ink-tertiary';
  const rootStyle = {
    position: 'absolute' as const,
    top: RAIL_LAYOUT.insetTop,
    bottom: RAIL_LAYOUT.insetBottom,
    right: RAIL_LAYOUT.insetRight,
    width: RAIL_LAYOUT.width,
    zIndex: 5,
  };

  return (
    <div data-testid="references-rail" className={rootClass} style={rootStyle}>
      <button
        type="button"
        onMouseDown={event => {
          event.preventDefault();
        }}
        onClick={() => {
          setFullMode(!fullMode);
        }}
        className="pointer-events-auto cursor-pointer"
      >
        <Translate className="sr-only">Toggle timeline mode</Translate>
        {fullMode ? (
          <Square3Stack3DIcon className="w-4 h-4" />
        ) : (
          <DocumentIcon className="w-4 h-4" />
        )}
      </button>
      <div
        className="pointer-events-none relative flex min-h-0 w-4 flex-1 flex-col items-center"
        style={{
          marginTop: RAIL_LAYOUT.trackTopBelowToggle - RAIL_LAYOUT.insetTop,
        }}
      >
        <div className="h-full w-0.5 opacity-50 bg-(--color-theme-border-default)" />
        <div ref={markerLayerR f} className="absolu e inset-0 flex flex-col items-center">
          {fullMode ? (
            <FullMode
              document={document}
              markerLayerHeight={markerLayerHeight}
              documentClusters={documentClusters}
              pageHeight={pageHeight}
              onPointClick={onPointClick}
              onClusterClick={onClusterClick}
            />
          ) : (
            <PageMode
              markerLayerHeight={markerLayerHeight}
              referencesGroups={referencesGroups}
              references={references}
              currentPage={currentPage}
              pageHeight={pageHeight}
              onPointClick={onPointClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { ReferencesDisplay };
export type { ReferencesDisplayProps };
