import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { Map, Layer } from 'app/Map/MapContainer';
import { Label, InputField } from 'app/V2/Components/Forms';

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
}

interface Marker {
  latitude: number;
  longitude: number;
  properties: { [k: string]: any };
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
}: GeolocationProps) => {
  const [currentLatitude, setCurrentLatitude] = useState(value?.lat);
  const [currentLongitude, setCurrentLongitude] = useState(value?.lon);
  const [currentMarkers, setCurrentMarkers] = useState<Marker[] | undefined>(undefined);

  const latChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLatitude(e.target.valueAsNumber);
    if (onChange) {
      onChange({ lat: e.target.valueAsNumber, lon: currentLongitude });
    }
  };

  const lonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLongitude(e.target.valueAsNumber);
    if (onChange) {
      onChange({ lat: currentLatitude, lon: e.target.valueAsNumber });
    }
  };

  const clearCoordinates = () => {
    setCurrentLatitude(undefined);
    setCurrentLongitude(undefined);
    setCurrentLatitude(undefined);
    if (onChange) {
      onChange({ lat: undefined, lon: undefined });
    }
  };

  useEffect(() => {
    if (currentLatitude && currentLongitude) {
      setCurrentMarkers([
        {
          latitude: currentLatitude,
          longitude: currentLongitude,
          properties: {},
        },
      ]);
    }
  }, [currentLatitude, currentLongitude, setCurrentMarkers]);

  const mapClick = ({ lngLat }: { lngLat: [number, number] }) => {
    if (disabled) return;
    const [lon, lat] = lngLat;
    setCurrentLatitude(lat);
    setCurrentLongitude(lon);
    if (onChange) {
      onChange({ lat, lon });
    }
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
          clearFieldAction={clearCoordinates}
          value={currentLatitude || ''}
          label={<Translate>Latitude</Translate>}
          id="lat"
          name={`${name}[lat]`}
        />
        <InputField
          className="grow"
          label={<Translate>Longitude</Translate>}
          onChange={lonChange}
          disabled={disabled}
          clearFieldAction={clearCoordinates}
          value={currentLongitude || ''}
          id="lon"
          name={`${name}[lon]`}
        />
      </div>
    </div>
  );
};

export { Geolocation };
