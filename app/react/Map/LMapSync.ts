import type { RefObject } from 'react';
import Leaflet from 'leaflet';
import { GeolocationSchema } from '#shared/types/commonTypes.js';
import { getMapProvider } from './TilesProviderFactory.js';
import {
  addMapMarkers,
  finishMapSetup,
  handleMapClick,
  mapGestureHandlers,
  syncMapMarkers,
  type Layer,
  type MarkerLayerArgs,
} from './LMapSetup.js';

type MarkerSyncState = Omit<MarkerLayerArgs, 'map' | 'markerGroup' | 'fitToMarkers'> & {
  syncKey: string;
};

const markerLayerArgs = ({
  map,
  markerGroup,
  markerState,
  fitToMarkers,
}: {
  map: Leaflet.Map;
  markerGroup: Leaflet.MarkerClusterGroup;
  markerState: MarkerSyncState;
  fitToMarkers: boolean;
}): MarkerLayerArgs => {
  const { syncKey, ...fields } = markerState;
  return { map, markerGroup, ...fields, fitToMarkers };
};

const syncMarkersIfNeeded = ({
  map,
  markerGroup,
  markerState,
  recenterRequest = 0,
  appliedSyncKeyRef,
  framedRequestRef,
}: {
  map: Leaflet.Map | null;
  markerGroup: Leaflet.MarkerClusterGroup | null;
  markerState: MarkerSyncState;
  recenterRequest?: number;
  appliedSyncKeyRef: RefObject<string | null>;
  framedRequestRef: RefObject<number>;
}) => {
  if (!map || !markerGroup) return;
  if (recenterRequest === 0) framedRequestRef.current = 0;
  const shouldFrame =
    recenterRequest > framedRequestRef.current && markerState.pointMarkers.length > 0;
  if (appliedSyncKeyRef.current === markerState.syncKey && !shouldFrame) return;
  syncMapMarkers(markerLayerArgs({ map, markerGroup, markerState, fitToMarkers: shouldFrame }));
  appliedSyncKeyRef.current = markerState.syncKey;
  if (shouldFrame) framedRequestRef.current = recenterRequest;
};

const clearStaleLeafletId = (containerId: string) => {
  const container = document.getElementById(containerId);
  if (!container || !('_leaflet_id' in container)) return;
  Reflect.deleteProperty(container, '_leaflet_id');
};

const pickMapLayers = (
  baseMaps: ReturnType<typeof getMapProvider>,
  layers: Layer[] | undefined
) => {
  const mapLayers: { [k: string]: Leaflet.TileLayer } = {};
  Object.keys(baseMaps).forEach(key => {
    const mapKey = baseMaps[key].key;
    if (layers?.length && !layers.includes(mapKey as Layer)) {
      return;
    }
    mapLayers[key] = baseMaps[key].layer;
  });
  return mapLayers;
};

const leafletMapOptions = (
  startingPoint: GeolocationSchema,
  zoom: number,
  provider: 'google' | 'mapbox'
): Leaflet.MapOptions => ({
  center: [startingPoint[0].lat, startingPoint[0].lon],
  zoom,
  maxZoom: 20,
  minZoom: 2,
  zoomControl: false,
  preferCanvas: true,
  scrollWheelZoom: false,
  wheelDebounceTime: 100,
  dragging: false,
  attributionControl: provider === 'google',
});

const bindMapGestures = (map: Leaflet.Map, shouldScroll: boolean) => {
  const gestures = mapGestureHandlers(() => map, shouldScroll);
  map.on('click', gestures.enable);
  document.addEventListener('click', gestures.disable);
  map.getPanes().mapPane.style.zIndex = '0';
  return gestures;
};

const createLeafletMap = ({
  containerId,
  provider,
  mapApiKey,
  layers,
  startingPoint,
  zoom,
  showControls,
  shouldScroll,
  attributionControlRef,
  markerState,
  frameOnLoad,
  readOnClick,
}: {
  containerId: string;
  provider: 'google' | 'mapbox';
  mapApiKey: string;
  layers: Layer[] | undefined;
  startingPoint: GeolocationSchema;
  zoom: number;
  showControls: boolean;
  shouldScroll: boolean;
  attributionControlRef: RefObject<Leaflet.Control.Attribution | null>;
  markerState: MarkerSyncState;
  frameOnLoad: boolean;
  readOnClick: () => ((event: { lngLat: [number, number] }) => void) | undefined;
}) => {
  clearStaleLeafletId(containerId);
  const baseMaps = getMapProvider(provider, mapApiKey);
  const mapLayers = pickMapLayers(baseMaps, layers);
  const map = Leaflet.map(containerId, leafletMapOptions(startingPoint, zoom, provider));
  const markerGroup = Leaflet.markerClusterGroup();
  const fitToMarkers = frameOnLoad && markerState.pointMarkers.length > 0;
  const gestures = bindMapGestures(map, shouldScroll);
  finishMapSetup({
    map,
    mapLayers,
    baseMaps,
    provider,
    showControls,
    attributionControlRef,
    initMarkers: () =>
      addMapMarkers(markerLayerArgs({ map, markerGroup, markerState, fitToMarkers })),
    clickHandler: markerPoint =>
      handleMapClick({ map, markerGroup, onClick: readOnClick(), markerPoint }),
  });
  return { map, markerGroup, gestures };
};

export { createLeafletMap, syncMarkersIfNeeded };
export type { MarkerSyncState };
