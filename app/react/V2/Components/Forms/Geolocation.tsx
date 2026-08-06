import React, { useEffect, useState } from 'react';
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

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

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
}

interface Marker {
  latitude: number;
  longitude: number;
  properties: { [k: string]: unknown };
}

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
}: GeolocationProps) => {
  const [currentLatitude, setCurrentLatitude] = useState(value?.lat);
  const [currentLongitude, setCurrentLongitude] = useState(value?.lon);

  useEffect(() => {
    setCurrentLatitude(value?.lat);
    setCurrentLongitude(value?.lon);
  }, [value?.lat, value?.lon]);

  const latChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCoordinate(e.target.value);
    const nextLat = parsed === undefined ? undefined : clampLatitude(parsed);
    setCurrentLatitude(nextLat);
    onChange?.({ lat: nextLat, lon: currentLongitude });
  };

  const lonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCoordinate(e.target.value);
    const nextLon = parsed === undefined ? undefined : clampLongitude(parsed);
    setCurrentLongitude(nextLon);
    onChange?.({ lat: currentLatitude, lon: nextLon });
  };

  const clearCoordinates = () => {
    setCurrentLatitude(undefined);
    setCurrentLongitude(undefined);
    onChange?.({ lat: undefined, lon: undefined });
  };

  const markers: Marker[] =
    isValidLatitude(currentLatitude) && isValidLongitude(currentLongitude)
      ? [{ latitude: currentLatitude, longitude: currentLongitude, properties: {} }]
      : [];

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
          clearFieldAction={clearCoordinates}
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
          clearFieldAction={clearCoordinates}
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
