import React from 'react';
import { Map } from '#app/Map/index.js';
import { MapProps } from '#app/Map/MapContainer.js';
import { GeolocationMetadataProperty } from '#V2/domain/entities/types.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';

type GeolocationProps = MetadataFieldProps & {
  markers: GeolocationMetadataProperty['values'];
  height?: MapProps['height'];
  clickOnMarker?: MapProps['clickOnMarker'];
  onClick?: MapProps['onClick'];
  showControls?: MapProps['showControls'];
  renderPopupInfo?: MapProps['renderPopupInfo'];
  layers?: MapProps['layers'];
  zoom?: MapProps['zoom'];
};

const formatMarkers = (
  points: GeolocationProps['markers'],
  fallbackLabel: string
): MapProps['markers'] =>
  points.map(point => ({
    latitude: point.value.latitude,
    longitude: point.value.longitude,
    properties: {
      label: point.source?.label || point.label,
      color: point.source?.color,
      info: point.source?.label || point.label || fallbackLabel,
    },
  }));

const Geolocation = ({
  label,
  markers,
  translationContext,
  hideLabel,
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
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd>
        <Map
          height={height}
          markers={formatMarkers(markers, label)}
          clickOnMarker={clickOnMarker}
          onClick={onClick}
          showControls={showControls}
          renderPopupInfo={renderPopupInfo}
          layers={layers}
          zoom={zoom}
        />
      </dd>
    </MetadataCard>
  );
};

export { Geolocation };
