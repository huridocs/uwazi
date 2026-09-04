import React from 'react';
import Leaflet from 'leaflet';
import { getMapProvider } from './TilesProviderFactory.js';
import {
  streetAttribution,
  satelliteAttribution,
  getImproveThisMapLegend,
} from './MapBoxAttributions.js';
import {
  DataMarker,
  getClusterMarker,
  MarkerInput,
  parseMarkerPoint,
  TemplatesInfo,
} from './MapHelper.js';

type Layer = 'Dark' | 'Streets' | 'Satellite' | 'Hybrid';

type MapClickHandler = (event: { lngLat: [number, number] }) => void;

const attributionForLayer = (baseMaps: ReturnType<typeof getMapProvider>, layerKey?: string) => {
  if (!layerKey) {
    return streetAttribution;
  }
  const layer = baseMaps[layerKey].key as Layer;
  return layer === 'Satellite' || layer === 'Hybrid' ? satelliteAttribution : streetAttribution;
};

const addMapChrome = ({
  map,
  mapLayers,
  showControls,
  attributionControlRef,
}: {
  map: Leaflet.Map;
  mapLayers: { [k: string]: Leaflet.TileLayer };
  showControls: boolean;
  attributionControlRef: React.MutableRefObject<Leaflet.Control.Attribution | null>;
}) => {
  attributionControlRef.current = Leaflet.control
    .attribution({ prefix: false, position: 'bottomright' })
    .addTo(map);
  if (showControls) {
    Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
  }
  if (showControls && Object.values(mapLayers).length > 1) {
    Leaflet.control
      .layers(mapLayers, {}, { position: 'bottomright', autoZIndex: false })
      .addTo(map);
  }
  const [initialLayer] = Object.values(mapLayers);
  initialLayer.options.zIndex = 0;
  initialLayer.addTo(map);
};

const bindMapAttribution = ({
  map,
  mapLayers,
  baseMaps,
  provider,
  attributionControlRef,
}: {
  map: Leaflet.Map;
  mapLayers: { [k: string]: Leaflet.TileLayer };
  baseMaps: ReturnType<typeof getMapProvider>;
  provider: 'google' | 'mapbox';
  attributionControlRef: React.MutableRefObject<Leaflet.Control.Attribution | null>;
}) => {
  const updateAttribution = (layerKey?: string) => {
    if (!attributionControlRef.current || provider === 'google') {
      return;
    }
    const center = map.getCenter();
    const container = attributionControlRef.current.getContainer();
    if (container) {
      container.innerHTML = `${attributionForLayer(baseMaps, layerKey)} - ${getImproveThisMapLegend(center.lng, center.lat, map.getZoom())}`;
    }
  };
  updateAttribution(Object.keys(mapLayers)[0]);
  map.on('baselayerchange', (e: Leaflet.LayersControlEvent) => {
    updateAttribution(Object.keys(mapLayers).find(key => mapLayers[key] === e.layer));
  });
  map.on('moveend', () => {
    updateAttribution(Object.keys(mapLayers).find(key => map.hasLayer(mapLayers[key])));
  });
};

const finishMapSetup = (args: {
  map: Leaflet.Map;
  mapLayers: { [k: string]: Leaflet.TileLayer };
  baseMaps: ReturnType<typeof getMapProvider>;
  provider: 'google' | 'mapbox';
  showControls: boolean;
  attributionControlRef: React.MutableRefObject<Leaflet.Control.Attribution | null>;
  initMarkers: () => void;
  clickHandler: (markerPoint: Leaflet.LeafletMouseEvent) => void;
}) => {
  addMapChrome(args);
  args.initMarkers();
  args.map.on('click', args.clickHandler);
  bindMapAttribution(args);
};

const mapGestureHandlers = (getMap: () => Leaflet.Map, shouldScroll: boolean) => ({
  enable: () => {
    const map = getMap();
    if (!map.scrollWheelZoom.enabled() && shouldScroll) {
      map.scrollWheelZoom.enable();
    }
  },
  disable: (event: MouseEvent) => {
    const map = getMap();
    if (event.target && !map.getContainer().contains(event.target as Node)) {
      map.scrollWheelZoom.disable();
      map.dragging.disable();
    }
  },
});

const handleMapClick = (args: {
  map: Leaflet.Map;
  markerGroup: Leaflet.MarkerClusterGroup;
  onClick?: MapClickHandler;
  markerPoint: Leaflet.LeafletMouseEvent;
}) => {
  const { map, markerGroup, onClick, markerPoint } = args;
  if (!map.dragging.enabled()) {
    map.dragging.enable();
    return;
  }
  if (!onClick) return;
  markerGroup.clearLayers();
  getClusterMarker({ ...markerPoint, properties: {} }).addTo(markerGroup);
  onClick({ lngLat: [markerPoint.latlng.lng, markerPoint.latlng.lat] });
};

const addMapMarkers = (args: {
  map: Leaflet.Map;
  markerGroup: Leaflet.MarkerClusterGroup;
  pointMarkers: MarkerInput[];
  deletedEntity: string | undefined;
  templatesInfo: TemplatesInfo;
  renderPopupInfo: boolean | undefined;
  zoom: number;
  clickOnCluster?: (cluster: DataMarker[]) => void;
  clickOnMarker?: (marker: DataMarker) => void;
}) => {
  const { map, markerGroup, pointMarkers, deletedEntity, templatesInfo, renderPopupInfo, zoom } =
    args;
  const markers = pointMarkers
    .map(pointMarker => parseMarkerPoint(pointMarker, templatesInfo, renderPopupInfo))
    .filter(marker => marker.properties.entity?.sharedId !== deletedEntity);
  markers.forEach(m => getClusterMarker(m).addTo(markerGroup));
  markerGroup.on('clusterclick', cluster => {
    args.clickOnCluster?.(cluster.layer.getAllChildMarkers());
  });
  markerGroup.on('click', marker => {
    args.clickOnMarker?.(marker.layer);
  });
  if (pointMarkers.length) {
    map.fitBounds(markerGroup.getBounds(), { maxZoom: zoom });
  }
  markerGroup.addTo(map);
};

export { finishMapSetup, mapGestureHandlers, handleMapClick, addMapMarkers };
