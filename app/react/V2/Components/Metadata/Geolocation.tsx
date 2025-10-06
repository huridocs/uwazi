import React from 'react';
import { Translate } from 'app/I18N';
import { Map } from 'app/Map';
import { MapProps } from 'app/Map/MapContainer';
import { MetadataFieldProps } from './types';

type GeolocationProps = MetadataFieldProps & {
  markers: { latitude: number; longitude: number }[];
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
    latitude: point.latitude,
    longitude: point.longitude,
    properties: {
      entity: {
        sharedId: 'placeholder',
        title: 'placeholder',
        template: 'placeholder',
      },
      templateInfo: {
        color: 'placeholder',
        name: 'placeholder',
      },
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
}: GeolocationProps) => (
  <div>
    <dt className={`${hideLabel ? 'sr-only' : 'font-bold text-gray-900'}`}>
      <Translate context={translationContext}>{label}</Translate>
    </dt>

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
);

export { Geolocation };
