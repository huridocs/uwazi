import React from 'react';
import { Map } from '#app/Map/index.js';
import { MapProps } from '#app/Map/MapContainer.js';
import { GeolocationMetadataProperty } from '#V2/formatters/types.js';
import type { OpenEntityTarget } from './ConnectionPills.js';
import { GeolocationLegend } from './GeolocationLegend.js';

type GeolocationPoint = GeolocationMetadataProperty['values'][number];

type GeolocationProps = {
  markers: GeolocationPoint[];
  height?: MapProps['height'];
  clickOnMarker?: MapProps['clickOnMarker'];
  onClick?: MapProps['onClick'];
  showControls?: MapProps['showControls'];
  renderPopupInfo?: MapProps['renderPopupInfo'];
  layers?: MapProps['layers'];
  zoom?: MapProps['zoom'];
  showLegend?: boolean;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const formatMarkers = (points: GeolocationPoint[]): MapProps['markers'] =>
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
  height = 220,
  showLegend = false,
  onOpenEntity,
}: GeolocationProps) => {
  if (!markers?.length) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <div className="w-full min-w-0 overflow-hidden rounded-md [&_.map-container]:h-auto">
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
      </div>
      {showLegend ? <GeolocationLegend markers={markers} onOpenEntity={onOpenEntity} /> : null}
    </div>
  );
};

export { Geolocation };
