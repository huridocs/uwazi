import React, { useEffect } from 'react';
import L, { latLng } from 'leaflet';
import 'leaflet.markercluster';
import { getMapProvider } from 'app/Map/TileProviderFactory';
import { GeolocationSchema } from 'shared/types/commonTypes';
import { generateID } from 'shared/IDGenerator';

interface LMapProps {
  markers: { latitude: number; longitude: number; properties: { entity?: { title: string } } }[];
  height: number;
  clickOnMarker: (marker: DataMarker) => {};
  clickOnCluster: (cluster: DataMarker[]) => {};
  onClick: (event: {}) => {};
  showControls: boolean;
  mapProvider: string;
  startingPoint: GeolocationSchema;
}

class DataMarker extends L.Marker {
  properties?: any;

  constructor(latLngExpression: L.LatLngExpression, properties: any, options?: L.MarkerOptions) {
    super(latLngExpression, options);
    this.properties = properties;
  }
}

const LMap = ({ markers: pointMarkers = [], ...props }: LMapProps) => {
  let map: L.Map;
  let markerGroup: L.MarkerClusterGroup;
  const containerId = generateID(3, 4, 0);

  const clickOnClusterHandler = (cluster: any) => {
    props.clickOnCluster(cluster.layer.getAllChildMarkers());
  };

  const clickOnMarkerHandler = (marker: any) => {
    props.clickOnMarker(marker.layer);
  };

  const addClusterMarker = (markerPoint: any) => {
    const marker = new DataMarker(
      [markerPoint.latlng.lat, markerPoint.latlng.lng],
      markerPoint.properties
    );
    if (markerPoint.properties?.entity?.title) {
      marker.bindTooltip(markerPoint.properties?.entity?.title);
    }
    marker.addTo(markerGroup);
  };

  const clickHandler = (markerPoint: any) => {
    if (!props.onClick) return;
    markerGroup.clearLayers();
    addClusterMarker(markerPoint);
    const event = { lngLat: [markerPoint.latlng.lng, markerPoint.latlng.lat] };
    props.onClick(event);
  };

  const initMarkers = () => {
    const markers = pointMarkers.map(pointMarker => ({
      latlng: latLng(pointMarker.latitude, pointMarker.longitude),
      properties: pointMarker.properties,
    }));
    markers.forEach(m => addClusterMarker(m));
    markerGroup.on('clusterclick', clickOnClusterHandler);
    markerGroup.on('click', clickOnMarkerHandler);
    if (pointMarkers.length) {
      map.fitBounds(markerGroup.getBounds(), { maxZoom: 6 });
    }
    map.addLayer(markerGroup);
  };

  const initMap = () => {
    const { layers, baseMaps } = getMapProvider(props.mapProvider);
    map = L.map(containerId, {
      center: [props.startingPoint[0].lat, props.startingPoint[0].lon],
      zoom: 6,
      maxZoom: 20,
    });
    markerGroup = L.markerClusterGroup();
    initMarkers();
    L.control.layers(baseMaps).addTo(map);
    layers[0].addTo(map);
    map.on('click', clickHandler);
  };

  useEffect(() => {
    if (!map) {
      const container = L.DomUtil.get(containerId);
      if (container != null) {
        // @ts-ignore
        container._leaflet_id = null;
      }
    }

    initMap();
  }, []);

  return (
    <div id="map-container">
      <div
        id={containerId}
        className="leafletmap"
        style={{ width: '100%', height: props.height }}
      />
    </div>
  );
};

export { LMap };
