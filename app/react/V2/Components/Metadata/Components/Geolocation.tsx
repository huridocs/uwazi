import React from 'react';
import { Map } from '#app/Map/index.js';
import { MapProps } from '#app/Map/MapContainer.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { GeolocationMetadataProperty } from '#V2/metadata/types.js';

type GeolocationProps = MetadataFieldProps & {
  markers: GeolocationMetadataProperty['values'];
  height?: MapProps['height'];
  clickOnMarker?: MapProps['clickOnMarker'];
  onClick?: MapProps['onClick'];
  showControls?: MapProps['showControls'];
  renderPopupInfo?: MapProps['renderPopupInfo'];
  layers?: MapProps['layers'];
  zoom?: MapProps['zoom'];
  isGroup?: boolean;
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
  isGroup,
  height = 500,
}: GeolocationProps) => {
  if (!markers?.length) {
    return null;
  }

  return (
    <MetadataCard>
      <dt>
        {isGroup ? (
          <PropertyLabel
            label="Grouped geolocation properties"
            translationContext="System"
            hideLabel={hideLabel}
          />
        ) : (
          <PropertyLabel
            label={label}
            translationContext={translationContext}
            hideLabel={hideLabel}
          />
        )}
      </dt>
      <dd>
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
      </dd>
    </MetadataCard>
  );
};

export { Geolocation };
