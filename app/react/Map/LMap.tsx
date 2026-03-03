/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import Leaflet from 'leaflet';
import { useAtomValue } from 'jotai';
import 'leaflet.markercluster';
import { GeolocationSchema } from '#shared/types/commonTypes.js';
import uniqueID from '#shared/uniqueID.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { deletedEntityAtom } from '#V2/atoms/index.js';
import {
  DataMarker,
  getClusterMarker,
  MarkerInput,
  parseMarkerPoint,
  TemplatesInfo,
  checkMapInitialization,
} from './MapHelper.js';
import { getMapProvider } from './TilesProviderFactory.js';
import {
  streetAttribution,
  satelliteAttribution,
  getImproveThisMapLegend,
} from './MapBoxAttributions.js';

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

const LMap = ({
  markers: pointMarkers = [],
  showControls = true,
  zoom = 6,
  layers,
  ...props
}: LMapProps) => {
  let map: Leaflet.Map;
  let markerGroup: Leaflet.MarkerClusterGroup;
  const [currentMarkers, setCurrentMarkers] = useState<MarkerInput[]>();
  const [currentTilesProvider, setCurrentTilesProvider] = useState(props.tilesProvider);
  const deletedEntity = useAtomValue(deletedEntityAtom);
  const containerId = uniqueID();
  const attributionControlRef = useRef<Leaflet.Control.Attribution | null>(null);

  const clickHandler = (markerPoint: any) => {
    if (!map.dragging.enabled()) {
      map.dragging.enable();
      return;
    }
    if (!props.onClick) {
      return;
    }
    markerGroup.clearLayers();
    getClusterMarker({ ...markerPoint, properties: {} }).addTo(markerGroup);
    const event = { lngLat: [markerPoint.latlng.lng, markerPoint.latlng.lat] };
    props.onClick(event);
  };

  const initMarkers = () => {
    const markers = pointMarkers
      .map(pointMarker => parseMarkerPoint(pointMarker, props.templatesInfo, props.renderPopupInfo))
      .filter(marker => {
        const entityId = marker.properties.entity?.sharedId;
        return entityId !== deletedEntity;
      });

    markers.forEach(m => getClusterMarker(m).addTo(markerGroup));
    markerGroup.on('clusterclick', cluster => {
      props.clickOnCluster?.(cluster.layer.getAllChildMarkers());
    });
    markerGroup.on('click', marker => {
      props.clickOnMarker?.(marker.layer);
    });
    if (pointMarkers.length) {
      map.fitBounds(markerGroup.getBounds(), { maxZoom: zoom });
    }
    markerGroup.addTo(map);
  };

  const shouldScroll: boolean = props.renderPopupInfo || props.onClick !== undefined;
  const enableMapGestures = () => {
    if (!map.scrollWheelZoom.enabled()) {
      if (shouldScroll) {
        map.scrollWheelZoom.enable();
      }
    }
  };

  const disableMapGestures = (event: MouseEvent) => {
    if (event.target && !map.getContainer().contains(event.target as Node)) {
      map.scrollWheelZoom.disable();
      map.dragging.disable();
    }
  };

  const initMap = () => {
    const baseMaps = getMapProvider(props.tilesProvider, props.mapApiKey);
    const mapLayers: { [k: string]: Leaflet.TileLayer } = {};
    Object.keys(baseMaps).forEach(key => {
      const mapKey = baseMaps[key].key;
      if (layers && layers.length && !layers.includes(mapKey as Layer)) {
        return;
      }
      mapLayers[key] = baseMaps[key].layer;
    });

    map = Leaflet.map(containerId, {
      center: [props.startingPoint[0].lat, props.startingPoint[0].lon],
      zoom,
      maxZoom: 20,
      minZoom: 2,
      zoomControl: false,
      preferCanvas: true,
      scrollWheelZoom: false,
      wheelDebounceTime: 100,
      dragging: false,
      attributionControl: currentTilesProvider === 'google',
    });

    map.on('click', enableMapGestures);
    document.addEventListener('click', disableMapGestures);
    map.getPanes().mapPane.style.zIndex = '0';
    markerGroup = Leaflet.markerClusterGroup();

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

    const initialLayer = Object.values(mapLayers)[0];
    initialLayer.options.zIndex = 0;
    initialLayer.addTo(map);
    initMarkers();
    map.on('click', clickHandler);

    const updateAttribution = (layerKey?: string) => {
      if (!attributionControlRef.current || currentTilesProvider === 'google') {
        return;
      }

      const center = map.getCenter();
      const currentZoom = map.getZoom();
      const improveThisMapLink = getImproveThisMapLegend(center.lng, center.lat, currentZoom);

      let attribution = streetAttribution;

      if (layerKey) {
        const layer = baseMaps[layerKey].key as Layer;
        if (layer === 'Satellite' || layer === 'Hybrid') {
          attribution = satelliteAttribution;
        }
      }

      const container = attributionControlRef.current.getContainer();
      if (container) {
        container.innerHTML = `${attribution} - ${improveThisMapLink}`;
      }
    };

    const initialLayerKey = Object.keys(mapLayers)[0];
    updateAttribution(initialLayerKey);

    map.on('baselayerchange', (e: Leaflet.LayersControlEvent) => {
      const layerKey = Object.keys(mapLayers).find(key => mapLayers[key] === e.layer);
      updateAttribution(layerKey);
    });

    map.on('moveend', () => {
      const layerKey = Object.keys(mapLayers).find(key => map.hasLayer(mapLayers[key]));
      updateAttribution(layerKey);
    });
  };

  useEffect(() => {
    const reRender = currentTilesProvider !== props.tilesProvider || !props.onClick;

    if (reRender || currentMarkers === undefined) {
      setCurrentMarkers(pointMarkers);
      setCurrentTilesProvider(props.tilesProvider);
      checkMapInitialization(map, containerId);
      initMap();
    }
    return () => {
      if (map && reRender) {
        map.off('click', enableMapGestures);
        document.removeEventListener('click', disableMapGestures);
        map.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointMarkers, props.tilesProvider, props.mapApiKey]);

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
