import React, { useEffect, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Map, Layer } from '#app/Map/MapContainer.js';
import { Label, InputField } from '#V2/Components/Forms/index.js';
import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
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
  startingPoint?: { lat: number; lon: number };
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
  const [currentMarkers, setCurrentMarkers] = useState<Marker[] | undefined>(undefined);

  useEffect(() => {
    setCurrentLatitude(value?.lat);
    setCurrentLongitude(value?.lon);
  }, [value?.lat, value?.lon]);

  const latChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextLat = parseCoordinate(e.target.value);
    setCurrentLatitude(nextLat);
    onChange?.({ lat: nextLat, lon: currentLongitude });
  };

  const lonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextLon = parseCoordinate(e.target.value);
    setCurrentLongitude(nextLon);
    onChange?.({ lat: currentLatitude, lon: nextLon });
  };

  const clearCoordinates = () => {
    setCurrentLatitude(undefined);
    setCurrentLongitude(undefined);
    onChange?.({ lat: undefined, lon: undefined });
  };

  useEffect(() => {
    if (isValidLatitude(currentLatitude) && isValidLongitude(currentLongitude)) {
      setCurrentMarkers([
        {
          latitude: currentLatitude,
          longitude: currentLongitude,
          properties: {},
        },
      ]);
      return;
    }
    setCurrentMarkers(undefined);
  }, [currentLatitude, currentLongitude]);

  const mapClick = ({ lngLat }: { lngLat: [number, number] }) => {
    if (disabled) return;
    const [lon, lat] = lngLat;
    setCurrentLatitude(lat);
    setCurrentLongitude(lon);
    onChange?.({ lat, lon });
  };

  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Map
        onClick={mapClick}
        height={370}
        showControls
        zoom={zoom}
        layers={layers}
        markers={currentMarkers || []}
      />
      <div className="flex gap-4">
        <InputField
          className="grow"
          onChange={latChange}
          disabled={disabled}
          hasErrors={hasErrors}
          clearFieldAction={clearCoordinates}
          value={currentLatitude ?? ''}
          label={<Translate>Latitude</Translate>}
          id="lat"
          name={`${name}[lat]`}
          type="number"
          min={LATITUDE_MIN}
          max={LATITUDE_MAX}
          autoComplete="off"
        />
        <InputField
          className="grow"
          label={<Translate>Longitude</Translate>}
          onChange={lonChange}
          disabled={disabled}
          hasErrors={hasErrors}
          clearFieldAction={clearCoordinates}
          value={currentLongitude ?? ''}
          id="lon"
          name={`${name}[lon]`}
          type="number"
          min={LONGITUDE_MIN}
          max={LONGITUDE_MAX}
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export { Geolocation };
