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

/** Printed map box: 8cm tall. Leaflet reads the container in px at 96dpi. */
const PAPER_MAP_HEIGHT = 302;
const PAPER_MAP_CREDIT = '© Mapbox © OpenStreetMap';

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

  const markersForMap = formatMarkers(markers);
  const sharedMapProps = {
    markers: markersForMap,
    clickOnMarker,
    onClick,
    renderPopupInfo,
    layers,
    zoom,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <div
        data-part="map-frame"
        className="relative w-full min-w-0 overflow-hidden rounded-md [&_.map-container]:h-auto"
      >
        <div data-part="screen-map">
          <Map height={height} showControls={showControls} {...sharedMapProps} />
        </div>
        <div
          data-part="print-map"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-0"
        >
          <div className="absolute top-0 left-1/2 h-[8cm] w-[19cm] -translate-x-1/2 rtl:translate-x-1/2">
            <Map height={PAPER_MAP_HEIGHT} showControls={false} {...sharedMapProps} />
          </div>
        </div>
      </div>
      <p data-part="map-credit" className="hidden">
        {PAPER_MAP_CREDIT}
      </p>
      {showLegend ? <GeolocationLegend markers={markers} onOpenEntity={onOpenEntity} /> : null}
    </div>
  );
};

export { Geolocation };
