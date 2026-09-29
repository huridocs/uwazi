import React, { useCallback, useMemo } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Map } from '#app/Map/index.js';
import type { DataMarker } from '#app/Map/MapHelper.js';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import type { LibraryClickModifiers } from '../../librarySelection.js';
import type { LibraryViewerProps } from './types.js';
import { libraryMapMarkers } from './libraryMapMarkers.js';

type MapViewerProps = Pick<
  LibraryViewerProps,
  'rows' | 'totalRows' | 'onSelect' | 'onSelectCluster'
>;

const entitySharedId = (marker: DataMarker) => marker.properties?.entity?.sharedId;

const clusterSharedIds = (cluster: DataMarker[]) =>
  cluster.map(entitySharedId).filter((sharedId): sharedId is string => Boolean(sharedId));

const MapViewer = ({ rows, onSelect, onSelectCluster }: MapViewerProps) => {
  const templates = useAtomValue(templatesAtom);
  const markers = useMemo(() => libraryMapMarkers(rows, templates), [rows, templates]);

  const clickOnMarker = useCallback(
    (marker: DataMarker, modifiers?: LibraryClickModifiers) => {
      const sharedId = entitySharedId(marker);
      if (sharedId) {
        onSelect(sharedId, modifiers);
      }
    },
    [onSelect]
  );

  const clickOnCluster = useCallback(
    (cluster: DataMarker[], modifiers?: LibraryClickModifiers) => {
      const sharedIds = clusterSharedIds(cluster);
      if (onSelectCluster) {
        onSelectCluster(sharedIds, modifiers);
        return;
      }
      const [sharedId] = sharedIds;
      if (sharedId) {
        onSelect(sharedId, modifiers);
      }
    },
    [onSelect, onSelectCluster]
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
