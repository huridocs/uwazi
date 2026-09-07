/* eslint-disable max-statements */
import React from 'react';
import { useAtomValue } from 'jotai';
import { LMap } from '#app/Map/index.js';
import { DataMarker, MarkerInput } from '#app/Map/MapHelper.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/index.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';

type Layer = 'Dark' | 'Street' | 'Satellite' | 'Hybrid';

type MapProps = {
  markers?: MarkerInput[];
  height?: number;
  clickOnMarker?: (marker: DataMarker) => {};
  clickOnCluster?: (cluster: DataMarker[]) => {};
  onClick?: (event: { lngLat: [number, number] }) => void;
  showControls?: boolean;
  renderPopupInfo?: boolean;
  layers?: Layer[];
  zoom?: number;
};

const Map = ({ ...props }: MapProps) => {
  const collectionSettings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);
  const startingPoint = collectionSettings?.mapStartingPoint || [{ lat: 46, lon: 6 }];
  const tilesProvider = collectionSettings?.tilesProvider || 'mapbox';
  const mapApiKey = collectionSettings?.mapApiKey;
  let mapLayers = (props.layers || collectionSettings?.mapLayers) as Layer[];

  if (tilesProvider === 'google') {
    mapLayers = mapLayers?.filter(layer => layer !== 'Dark');
  }

  // The Google Maps JS API is loaded (and awaited) inside LMap via
  // ensureGoogleMaps — a fire-and-forget load here raced the map's layer
  // construction and swallowed every failure.

  const templatesInfo = templates.reduce(
    (info, t) => ({
      ...info,
      ...(t
        ? {
            [t._id]: {
              color: t.color,
              name: t.name,
            },
          }
        : {}),
    }),
    {}
  );
  const mapProps = {
    ...props,
    startingPoint,
    tilesProvider,
    mapApiKey,
    templatesInfo,
    layers: mapLayers,
  };
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <LMap {...mapProps} />
    </ErrorBoundary>
  );
};

export { Map };
export type { Layer, MapProps };
