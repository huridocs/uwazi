import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { getMapProvider } from 'app/Map/TileProviderFactory';

interface LMapProps {
  markers: { latitude: number; longitude: number; properties: { entity?: { title: string } } }[];
  height: number;
  clickOnMarker: (marker: DataMarker) => {};
  clickOnCluster: (cluster: DataMarker[]) => {};
  onClick: () => {};
  showControls: boolean;
  mapProvider: string;
}

class DataMarker extends L.Marker {
  properties: any;

  constructor(latLng: L.LatLngExpression, properties: any, options?: L.MarkerOptions) {
    super(latLng, options);
    this.properties = properties;
  }
}

const LMap = (props: LMapProps) => {
  let map: L.Map | L.LayerGroup;

  const clickOnClusterHandler = (cluster: any) => {
    props.clickOnCluster(cluster.layer.getAllChildMarkers());
  };

  const clickOnMarkerHandler = (marker: any) => {
    props.clickOnMarker(marker.layer);
  };

  useEffect(() => {
    if (map) return;
    try {
      const { layers, baseMaps } = getMapProvider(props.mapProvider);
      map = L.map('leafletmap', { center: [46, 6], zoom: 6 });
      L.control.layers(baseMaps).addTo(map);
      layers[0].addTo(map);
      const marketPoints = props.markers || [];
      if (!marketPoints.length) {
        marketPoints.push({ latitude: 46, longitude: 6, properties: {} });
      }
      const markerGroup = L.markerClusterGroup();
      marketPoints.forEach(markerPoint => {
        const marker = new DataMarker(
          [markerPoint.latitude, markerPoint.longitude],
          markerPoint.properties
        );
        if (markerPoint.properties?.entity?.title) {
          marker.bindTooltip(markerPoint.properties?.entity?.title);
        }
        markerGroup.addLayer(marker);
      });
      markerGroup.on('clusterclick', clickOnClusterHandler);
      markerGroup.on('click', clickOnMarkerHandler);
      map.on('click', props.onClick);
      map.addLayer(markerGroup);
      map.fitBounds(markerGroup.getBounds());
    } catch (e) {
      console.log(e);
    }
  }, []);

  return (
    <div id="map-container">
      <div id="leafletmap" style={{ width: '100%', height: props.height }} />
    </div>
  );
};

export { LMap };
