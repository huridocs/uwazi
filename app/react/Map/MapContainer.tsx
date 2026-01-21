/* eslint-disable max-statements */
import React, { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { isClient } from '#app/utils/index.js';

import { LMap } from '#app/Map/index.jsx';

import { DataMarker, MarkerInput } from '#app/Map/MapHelper.jsx';
import { IStore } from '#app/istore.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.jsx';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';

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

  useEffect(() => {
    if (tilesProvider === 'google' && mapApiKey && isClient) {
      import('@googlemaps/js-api-loader').then(module => {
        const GoogleMapsLoader = module.default || module;
        const Loader = GoogleMapsLoader.Loader || module.Loader;
        if (Loader) {
          const loader = new Loader({
            apiKey: mapApiKey,
            retries: 0,
          });
          loader
            .load()
            .then(() => {})
            .catch(() => {});
        }
      }).catch(() => {});
    }
  }, [tilesProvider, mapApiKey]);

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
