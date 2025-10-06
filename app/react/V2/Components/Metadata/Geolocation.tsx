import React from 'react';
import { Translate } from 'app/I18N';
import { Map } from 'app/Map';
import { MetadataFieldProps } from './types';

type GeolocationProps = MetadataFieldProps & {
  data: { lat: number; lon: number };
  height?: number;
};

const Geolocation = ({
  label,
  data,
  translationContext,
  hideLabel,
  height = 500,
}: GeolocationProps) => (
  <div>
    <dt className={`${hideLabel ? 'sr-only' : 'font-bold text-gray-900'}`}>
      <Translate context={translationContext}>{label}</Translate>
    </dt>
    <div className="sr-only">
      <dd>
        <Translate>Latitude</Translate> {data.lat}
      </dd>
      <dd>
        <Translate>Longitude</Translate> {data.lon}
      </dd>
    </div>

    <Map
      height={height}
      markers={[{ latitude: data.lat, longitude: data.lon, properties: {} }]}
      showControls
    />
  </div>
);

export { Geolocation };
