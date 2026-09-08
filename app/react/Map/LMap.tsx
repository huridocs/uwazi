import React, { useEffect, useMemo, useRef } from 'react';
import Leaflet from 'leaflet';
import { useAtomValue } from 'jotai';
import 'leaflet.markercluster';
import { captureException } from '@sentry/react';
import { GeolocationSchema } from '#shared/types/commonTypes.js';
import uniqueID from '#shared/uniqueID.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { deletedEntityAtom } from '#V2/atoms/index.js';
import { DataMarker, MarkerInput, TemplatesInfo, checkMapInitialization } from './MapHelper.js';
import { getMapProvider } from './TilesProviderFactory.js';
import { ensureGoogleMaps } from './GoogleMapLayer.js';
import { addMapMarkers, finishMapSetup, handleMapClick, mapGestureHandlers } from './LMapSetup.js';

type Layer = 'Dark' | 'Streets' | 'Satellite' | 'Hybrid';

type LMapProps = {
  markers?: MarkerInput[];
  height: number;
  clickOnMarker?: (marker: DataMarker) => {};
  clickOnCluster?: (cluster: DataMarker[]) => {};
  onClick?: (event: {}) => {};
  showControls?: boolean;
  startingPoint: GeolocationSchema;
  renderPopupInfo?: boolean;
  templatesInfo: TemplatesInfo;
  tilesProvider: 'google' | 'mapbox';
  mapApiKey: string;
  zoom?: number;
  layers?: Layer[];
};

const EMPTY_MARKERS: MarkerInput[] = [];

const markerSyncKey = (markers: MarkerInput[], deletedEntity?: string) =>
  `${deletedEntity || ''}|${markers
    .map(
      marker =>
        `${marker.latitude},${marker.longitude},${marker.label ?? ''},${marker.properties?.info ?? ''},${marker.properties?.color ?? ''},${marker.properties?.entity?.sharedId ?? ''}`
    )
    .join(';')}`;

const pickMapLayers = (
  baseMaps: ReturnType<typeof getMapProvider>,
  layers: Layer[] | undefined
) => {
  const mapLayers: { [k: string]: Leaflet.TileLayer } = {};
  Object.keys(baseMaps).forEach(key => {
    const mapKey = baseMaps[key].key;
    if (layers && layers.length && !layers.includes(mapKey as Layer)) {
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
) => ({
  center: [startingPoint[0].lat, startingPoint[0].lon] as [number, number],
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

const useMarkerSyncKey = (pointMarkers: MarkerInput[]) => {
  const deletedEntity = useAtomValue(deletedEntityAtom);
  const syncKey = useMemo(
    () => markerSyncKey(pointMarkers, deletedEntity),
    [deletedEntity, pointMarkers]
  );
  return { deletedEntity, syncKey };
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
  let map: Leaflet.Map;
  let markerGroup: Leaflet.MarkerClusterGroup;
  const { deletedEntity, syncKey } = useMarkerSyncKey(pointMarkers);
  const attributionControlRef = useRef<Leaflet.Control.Attribution | null>(null);
  const shouldScroll = Boolean(props.renderPopupInfo || props.onClick);
  const gestures = mapGestureHandlers(() => map, shouldScroll);

  const initMap = (providerOverride?: 'google' | 'mapbox') => {
    const provider = providerOverride ?? props.tilesProvider;
    const baseMaps = getMapProvider(provider, props.mapApiKey);
    const mapLayers = pickMapLayers(baseMaps, layers);
    map = Leaflet.map(containerId, leafletMapOptions(props.startingPoint, zoom, provider));
    markerGroup = Leaflet.markerClusterGroup();
    map.on('click', gestures.enable);
    document.addEventListener('click', gestures.disable);
    map.getPanes().mapPane.style.zIndex = '0';
    finishMapSetup({
      map,
      mapLayers,
      baseMaps,
      provider,
      showControls,
      attributionControlRef,
      initMarkers: () =>
        addMapMarkers({
          map,
          markerGroup,
          pointMarkers,
          deletedEntity,
          templatesInfo: props.templatesInfo,
          renderPopupInfo: props.renderPopupInfo,
          zoom,
          clickOnCluster: props.clickOnCluster,
          clickOnMarker: props.clickOnMarker,
        }),
      clickHandler: markerPoint =>
        handleMapClick({ map, markerGroup, onClick: props.onClick, markerPoint }),
    });
  };

  useEffect(() => {
    let cancelled = false;
    checkMapInitialization(map, containerId);
    if (props.tilesProvider === 'google') {
      ensureGoogleMaps(props.mapApiKey)
        .then(() => {
          if (!cancelled) initMap();
        })
        .catch((err: unknown) => {
          captureException(err);
          if (!cancelled) initMap('mapbox');
        });
    } else {
      initMap();
    }
    return () => {
      cancelled = true;
      if (map) {
        map.off('click', gestures.enable);
        document.removeEventListener('click', gestures.disable);
        map.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey, props.tilesProvider, props.mapApiKey]);
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
