import React from 'react';
import { Map } from '#app/Map/index.js';
import { MapProps } from '#app/Map/MapContainer.js';
import { GeolocationMetadataProperty } from '#V2/formatters/types.js';

type GeolocationProps = {
  markers: GeolocationMetadataProperty['values'];
  height?: MapProps['height'];
  clickOnMarker?: MapProps['clickOnMarker'];
  onClick?: MapProps['onClick'];
  showControls?: MapProps['showControls'];
  renderPopupInfo?: MapProps['renderPopupInfo'];
  layers?: MapProps['layers'];
  zoom?: MapProps['zoom'];
};

const formatMarkers = (points: GeolocationProps['markers']): MapProps['markers'] =>
  points.map(point => ({
    latitude: point.value.latitude,
    longitude: point.value.longitude,
    properties: {
      label: point.label,
      color: point.color,
      info: point.label,
    },
  }));

const Geolocation = ({
  markers,
  clickOnMarker,
  onClick,
  showControls,
  renderPopupInfo,
  layers,
  zoom,
  height = 500,
}: GeolocationProps) => {
  if (!markers?.length) {
    return null;
  }

  return (
    <Map
      height={height}
      markers={formatMarkers(markers)}
      clickOnMarker={clickOnMarker}
      onClick={onClick}
      showControls={showControls}
      renderPopupInfo={renderPopupInfo}
      layers={layers}
      zoom={zoom}
    />
  );
};

export { Geolocation };
