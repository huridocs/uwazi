import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Map, Layer } from '#app/Map/MapContainer.js';
import { Label, InputField } from '#V2/Components/Forms/index.js';
import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  clampLatitude,
  clampLongitude,
  isValidLatitude,
  isValidLongitude,
  parseCoordinate,
} from '#shared/geolocationCoordinates.js';

interface GeolocationProps {
  name: string;
  onChange?: ({ lat, lon }: { lat?: number; lon?: number }) => void;
  value?: { lat?: number; lon?: number };
  label?: string;
  className?: string;
  disabled?: boolean;
  zoom?: number;
  layers?: Layer[];
  hasErrors?: boolean;
  hideClear?: boolean;
}

interface Marker {
  latitude: number;
  longitude: number;
  properties: { [k: string]: unknown };
}

const validPair = (lat?: number, lon?: number) =>
  isValidLatitude(lat) && isValidLongitude(lon) ? { lat, lon } : undefined;

const markersFor = (lat?: number, lon?: number): Marker[] => {
  const point = validPair(lat, lon);
  return point ? [{ latitude: point.lat, longitude: point.lon, properties: {} }] : [];
};

const adoptIncomingValue = (
  value: { lat?: number; lon?: number },
  current: { lat?: number; lon?: number },
  reset: () => void
) => {
  if (value.lat === current.lat && value.lon === current.lon) return;
  reset();
};

const coordinate = (raw: string, clamp: (value: number) => number) => {
  const parsed = parseCoordinate(raw);
  return parsed === undefined ? undefined : clamp(parsed);
};

const framePair = (
  lat: number | undefined,
  lon: number | undefined,
  setRecenterRequest: (update: (current: number) => number) => void
) => {
  if (validPair(lat, lon)) setRecenterRequest(current => current + 1);
};

const Geolocation = ({
  name,
  onChange,
  className,
  disabled,
  label,
  zoom,
  value = {},
  layers,
  hasErrors = false,
  hideClear = false,
}: GeolocationProps) => {
  const [currentLatitude, setCurrentLatitude] = useState(value?.lat);
  const [currentLongitude, setCurrentLongitude] = useState(value?.lon);
  const [recenterRequest, setRecenterRequest] = useState(() =>
    validPair(value.lat, value.lon) ? 1 : 0
  );
  adoptIncomingValue(value, { lat: currentLatitude, lon: currentLongitude }, () => {
    setCurrentLatitude(value.lat);
    setCurrentLongitude(value.lon);
    framePair(value.lat, value.lon, setRecenterRequest);
  });

  const latChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextLat = coordinate(e.target.value, clampLatitude);
    setCurrentLatitude(nextLat);
    framePair(nextLat, currentLongitude, setRecenterRequest);
    onChange?.({ lat: nextLat, lon: currentLongitude });
  };

  const lonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextLon = coordinate(e.target.value, clampLongitude);
    setCurrentLongitude(nextLon);
    framePair(currentLatitude, nextLon, setRecenterRequest);
    onChange?.({ lat: currentLatitude, lon: nextLon });
  };

  const clearCoordinates = () => {
    setCurrentLatitude(undefined);
    setCurrentLongitude(undefined);
    onChange?.({ lat: undefined, lon: undefined });
  };

  const markers = markersFor(currentLatitude, currentLongitude);

  const mapClick = ({ lngLat }: { lngLat: [number, number] }) => {
    if (disabled) return;
    const [lon, lat] = lngLat;
    const nextLat = clampLatitude(lat);
    const nextLon = clampLongitude(lon);
    setCurrentLatitude(nextLat);
    setCurrentLongitude(nextLon);
    onChange?.({ lat: nextLat, lon: nextLon });
  };

  return (
    <div className={['flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      {label ? <Label htmlFor={name}>{label}</Label> : null}
      <Map
        onClick={mapClick}
        recenterRequest={recenterRequest}
        height={370}
        showControls
        zoom={zoom}
        layers={layers}
        markers={markers}
      />
      <div className="flex gap-2">
        <InputField
          className="grow"
          onChange={latChange}
          disabled={disabled}
          hasErrors={hasErrors}
          clearFieldAction={hideClear ? undefined : clearCoordinates}
          value={currentLatitude ?? ''}
          label={<Translate>Latitude</Translate>}
          labelVariant="secondary"
          id={name}
          name={`${name}.lat`}
          type="number"
          min={LATITUDE_MIN}
          max={LATITUDE_MAX}
          step="any"
          autoComplete="off"
        />
        <InputField
          className="grow"
          label={<Translate>Longitude</Translate>}
          labelVariant="secondary"
          onChange={lonChange}
          disabled={disabled}
          hasErrors={hasErrors}
          clearFieldAction={hideClear ? undefined : clearCoordinates}
          value={currentLongitude ?? ''}
          id={`${name}.lon`}
          name={`${name}.lon`}
          type="number"
          min={LONGITUDE_MIN}
          max={LONGITUDE_MAX}
          step="any"
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export { Geolocation };
