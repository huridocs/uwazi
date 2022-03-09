import React, { useEffect, useState } from 'react';
import L, { latLng } from 'leaflet';
import 'leaflet.markercluster';
import { GeolocationSchema } from 'shared/types/commonTypes';
import uniqueID from 'shared/uniqueID';
import { DataMarker, getClusterMarker, MarkerInput, LMarker } from './MapHelper';
import { getMapProvider } from './TilesProviderFactory';

interface LMapProps {
  markers: MarkerInput[];
  height: number;
  clickOnMarker: (marker: DataMarker) => {};
  clickOnCluster: (cluster: DataMarker[]) => {};
  onClick: (event: {}) => {};
  showControls: boolean;
  startingPoint: GeolocationSchema;
  renderPopupInfo?: (marker: LMarker) => any;
  templatesInfo: { [k: string]: { color: string; name: string } };
  tilesProvider: string;
  mapApiKey: string;
}

const LMap = ({ markers: pointMarkers = [], ...props }: LMapProps) => {
  let map: L.Map;
  let markerGroup: L.MarkerClusterGroup;
  const [currentMarkers, setCurrentMarkers] = useState<MarkerInput[]>();
  const [currentTilesProvider, setCurrentTilesProvider] = useState(props.tilesProvider);
  const [currentMapApiKey, setCurrentMapApiKey] = useState(props.mapApiKey);
  const containerId = uniqueID();

  const clickHandler = (markerPoint: any) => {
    if (!props.onClick) return;
    markerGroup.clearLayers();
    getClusterMarker({ ...markerPoint, properties: {} }).addTo(markerGroup);
    const event = { lngLat: [markerPoint.latlng.lng, markerPoint.latlng.lat] };
    props.onClick(event);
  };

  const initMarkers = () => {
    const markers = pointMarkers.map(pointMarker => {
      const templateInfo = pointMarker.properties?.entity
        ? props.templatesInfo[pointMarker.properties.entity.template]
        : { color: '#d9534e', name: '' };

      return {
        latlng: latLng(pointMarker.latitude, pointMarker.longitude),
        properties: {
          ...pointMarker.properties,
          label: pointMarker.label || pointMarker.properties?.info,
          entity: pointMarker.properties?.entity,
          templateInfo,
          libraryMap: props.renderPopupInfo !== undefined,
        },
      };
    });

    markers.forEach(m => getClusterMarker(m).addTo(markerGroup));
    markerGroup.on('clusterclick', cluster => {
      props.clickOnCluster(cluster.layer.getAllChildMarkers());
    });
    markerGroup.on('click', marker => {
      props.clickOnMarker(marker.layer);
    });

    if (pointMarkers.length) {
      map.fitBounds(markerGroup.getBounds(), { maxZoom: 6 });
    }
    markerGroup.addTo(map);
  };

  const initMap = () => {
    const { layers, baseMaps } = getMapProvider(props.tilesProvider, props.mapApiKey);
    map = L.map(containerId, {
      center: [props.startingPoint[0].lat, props.startingPoint[0].lon],
      zoom: 6,
      maxZoom: 20,
      zoomControl: false,
    });
    markerGroup = L.markerClusterGroup();
    initMarkers();
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control.layers(baseMaps, {}, { position: 'bottomright', autoZIndex: false }).addTo(map);
    layers[0].addTo(map);
    map.on('click', clickHandler);
  };

  useEffect(() => {
    if (
      currentMarkers !== undefined &&
      currentMarkers.length === 1 &&
      props.onClick &&
      (currentTilesProvider === props.tilesProvider || currentMapApiKey === props.mapApiKey)
    ) {
      return;
    }
    setCurrentMarkers(pointMarkers);
    setCurrentTilesProvider(props.tilesProvider);
    setCurrentMapApiKey(props.mapApiKey);
    if (!map) {
      const container = L.DomUtil.get(containerId);
      if (container != null) {
        // @ts-ignore
        container._leaflet_id = null;
      }
    }
    initMap();
  }, [pointMarkers, props.tilesProvider, props.mapApiKey]);

  return (
    <div className="map-container">
      <div
        id={containerId}
        className="leafletmap"
        style={{ width: '100%', height: props.height }}
      />
    </div>
  );
};

export { LMap };
