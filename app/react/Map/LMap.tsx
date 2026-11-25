import React, { useEffect, useMemo, useRef } from 'react';
import 'leaflet';
import type Leaflet from 'leaflet';
import { useAtomValue } from 'jotai';
import 'leaflet.markercluster';
import { captureException } from '@sentry/react';
import { GeolocationSchema } from '#shared/types/commonTypes.js';
import uniqueID from '#shared/uniqueID.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { deletedEntityAtom } from '#V2/atoms/index.js';
import { DataMarker, MarkerInput, TemplatesInfo, type MapPointerModifiers } from './MapHelper.js';
import { ensureGoogleMaps } from './GoogleMapLayer.js';
import { createLeafletMap, syncMarkersIfNeeded, type MarkerSyncState } from './LMapSync.js';

type Layer = 'Dark' | 'Streets' | 'Satellite' | 'Hybrid';

type LMapProps = {
  markers?: MarkerInput[];
  height: number;
  clickOnMarker?: (marker: DataMarker, modifiers?: MapPointerModifiers) => void;
  clickOnCluster?: (cluster: DataMarker[], modifiers?: MapPointerModifiers) => void;
  onClick?: (event: {}) => {};
  showControls?: boolean;
  startingPoint: GeolocationSchema;
  renderPopupInfo?: boolean;
  templatesInfo: TemplatesInfo;
  tilesProvider: 'google' | 'mapbox';
  mapApiKey: string;
  zoom?: number;
  layers?: Layer[];
  recenterRequest?: number;
};

const EMPTY_MARKERS: MarkerInput[] = [];

const markerSyncKey = (markers: MarkerInput[], deletedEntity?: string) =>
  `${deletedEntity || ''}|${markers
    .map(
      marker =>
        `${marker.latitude},${marker.longitude},${marker.label ?? ''},${marker.properties?.info ?? ''},${marker.properties?.color ?? ''},${marker.properties?.entity?.sharedId ?? ''}`
    )
    .join(';')}`;

const useMarkerSyncKey = (pointMarkers: MarkerInput[]) => {
  const deletedEntity = useAtomValue(deletedEntityAtom);
  const syncKey = useMemo(
    () => markerSyncKey(pointMarkers, deletedEntity),
    [deletedEntity, pointMarkers]
  );
  return { deletedEntity, syncKey };
};

const useMapRefs = () => {
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerGroupRef = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const appliedSyncKeyRef = useRef<string | null>(null);
  const framedRequestRef = useRef(0);
  const attributionControlRef = useRef<Leaflet.Control.Attribution | null>(null);
  return { mapRef, markerGroupRef, appliedSyncKeyRef, framedRequestRef, attributionControlRef };
};

const useMarkerTracking = (
  pointMarkers: MarkerInput[],
  zoom: number,
  props: Omit<LMapProps, 'markers' | 'showControls' | 'zoom' | 'layers'>
) => {
  const { deletedEntity, syncKey } = useMarkerSyncKey(pointMarkers);
  const onClickRef = useRef(props.onClick);
  onClickRef.current = props.onClick;
  const markerState: MarkerSyncState = {
    pointMarkers,
    deletedEntity,
    templatesInfo: props.templatesInfo,
    renderPopupInfo: props.renderPopupInfo,
    zoom,
    syncKey,
    clickOnCluster: props.clickOnCluster,
    clickOnMarker: props.clickOnMarker,
  };
  const markerStateRef = useRef(markerState);
  markerStateRef.current = markerState;
  return { markerStateRef, onClickRef, syncKey };
};

const useLeafletMap = ({
  pointMarkers,
  showControls,
  zoom,
  layers,
  props,
  containerId,
}: {
  pointMarkers: MarkerInput[];
  showControls: boolean;
  zoom: number;
  layers: Layer[] | undefined;
  props: Omit<LMapProps, 'markers' | 'showControls' | 'zoom' | 'layers'>;
  containerId: string;
}) => {
  const { mapRef, markerGroupRef, appliedSyncKeyRef, framedRequestRef, attributionControlRef } =
    useMapRefs();
  const { markerStateRef, onClickRef, syncKey } = useMarkerTracking(pointMarkers, zoom, props);
  const shouldScroll = Boolean(props.renderPopupInfo || props.onClick);
  const initConfig = {
    showControls,
    zoom,
    layers,
    shouldScroll,
    startingPoint: props.startingPoint,
    tilesProvider: props.tilesProvider,
    mapApiKey: props.mapApiKey,
    frameOnLoad: props.recenterRequest === undefined,
  };
  const initConfigRef = useRef(initConfig);
  initConfigRef.current = initConfig;

  useEffect(() => {
    let cancelled = false;
    let created: ReturnType<typeof createLeafletMap> | undefined;
    const rememberMap = (next: ReturnType<typeof createLeafletMap>, syncKeyToFrame: string) => {
      created = next;
      mapRef.current = next.map;
      markerGroupRef.current = next.markerGroup;
      appliedSyncKeyRef.current = syncKeyToFrame;
    };
    const mountMap = (providerOverride?: 'google' | 'mapbox') => {
      if (cancelled) return;
      const config = initConfigRef.current;
      const markerState = markerStateRef.current;
      const provider = providerOverride ?? config.tilesProvider;
      const next = createLeafletMap({
        containerId,
        provider,
        mapApiKey: config.mapApiKey,
        layers: config.layers,
        startingPoint: config.startingPoint,
        zoom: config.zoom,
        showControls: config.showControls,
        shouldScroll: config.shouldScroll,
        attributionControlRef,
        markerState,
        frameOnLoad: config.frameOnLoad,
        readOnClick: () => onClickRef.current,
      });
      rememberMap(next, markerState.syncKey);
    };

    if (props.tilesProvider === 'google') {
      ensureGoogleMaps(props.mapApiKey)
        .then(() => mountMap())
        .catch((err: unknown) => {
          captureException(err);
          mountMap('mapbox');
        });
    } else {
      mountMap();
    }

    return () => {
      cancelled = true;
      if (created) {
        created.map.off('click', created.gestures.enable);
        document.removeEventListener('click', created.gestures.disable);
        created.map.remove();
      }
      mapRef.current = null;
      markerGroupRef.current = null;
      appliedSyncKeyRef.current = null;
      framedRequestRef.current = 0;
    };
  }, [
    appliedSyncKeyRef,
    attributionControlRef,
    containerId,
    framedRequestRef,
    mapRef,
    markerGroupRef,
    markerStateRef,
    onClickRef,
    props.mapApiKey,
    props.tilesProvider,
  ]);

  useEffect(() => {
    syncMarkersIfNeeded({
      map: mapRef.current,
      markerGroup: markerGroupRef.current,
      markerState: markerStateRef.current,
      recenterRequest: props.recenterRequest,
      appliedSyncKeyRef,
      framedRequestRef,
    });
  }, [
    appliedSyncKeyRef,
    framedRequestRef,
    mapRef,
    markerGroupRef,
    markerStateRef,
    props.recenterRequest,
    syncKey,
  ]);
};

const LMap = ({
  markers: pointMarkers = EMPTY_MARKERS,
  showControls = true,
  zoom = 6,
  layers,
  ...props
}: LMapProps) => {
  const containerId = useRef(uniqueID()).current;
  useLeafletMap({
    pointMarkers,
    showControls,
    zoom,
    layers,
    props,
    containerId,
  });
  return (
    <div className="map-container" data-testid="map-container">
      <div
        id={containerId}
        className="leafletmap"
        style={{ width: '100%', height: props.height }}
      />
    </div>
  );
};

export { LMap };
export type { LMapProps };
