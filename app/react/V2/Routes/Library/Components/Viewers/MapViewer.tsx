import React, { useCallback, useMemo } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Map } from '#app/Map/index.js';
import type { DataMarker } from '#app/Map/MapHelper.js';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import type { LibraryViewerProps } from './types.js';
import { libraryMapMarkers } from './libraryMapMarkers.js';

type MapViewerProps = Pick<LibraryViewerProps, 'rows' | 'totalRows' | 'onSelect'>;

const entitySharedId = (marker: DataMarker) => marker.properties?.entity?.sharedId;

const MapViewer = ({ rows, onSelect }: MapViewerProps) => {
  const templates = useAtomValue(templatesAtom);
  const markers = useMemo(() => libraryMapMarkers(rows, templates), [rows, templates]);

  const clickOnMarker = useCallback(
    (marker: DataMarker) => {
      const sharedId = entitySharedId(marker);
      if (sharedId) {
        onSelect(sharedId);
      }
      return {};
    },
    [onSelect]
  );

  const clickOnCluster = useCallback(
    (cluster: DataMarker[]) => {
      const sharedId = cluster.map(entitySharedId).find(Boolean);
      if (sharedId) {
        onSelect(sharedId);
      }
      return {};
    },
    [onSelect]
  );

  if (rows.length === 0) {
    return (
      <BlankState
        icon={<FolderIcon className="h-8 w-8 text-ink-muted" />}
        title={<Translate>No entities found</Translate>}
        description={<Translate>Try a different search or clear filters.</Translate>}
      />
    );
  }

  return (
    <div className="h-full min-h-0 p-3">
      <div className="h-full min-h-0 overflow-hidden rounded-md [&_.map-container]:h-full [&_.leafletmap]:h-full">
        <Map
          markers={markers}
          clickOnMarker={clickOnMarker}
          clickOnCluster={clickOnCluster}
          renderPopupInfo
          showControls
        />
      </div>
    </div>
  );
};

export type { MapViewerProps };
export { MapViewer };
