/* eslint-disable max-statements */
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Loader } from '@googlemaps/js-api-loader';
import { IStore } from 'app/istore';
import { LMap } from 'app/Map/index';
import { DataMarker, MarkerInput } from 'app/Map/MapHelper';
import { ErrorBoundary } from 'app/V2/Components/ErrorHandling';

type Layer = 'Dark' | 'Street' | 'Satellite' | 'Hybrid';

type MapComponentProps = {
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

const mapStateToProps = ({ settings, templates }: IStore) => ({
  collectionSettings: settings.collection,
  templates,
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MapComponentProps & mappedProps;

const MapComponent = ({ collectionSettings, templates, ...props }: ComponentProps) => {
  const startingPoint = collectionSettings?.get('mapStartingPoint')?.toJS() || [
    { lat: 46, lon: 6 },
  ];
  const tilesProvider = collectionSettings?.get('tilesProvider') || 'mapbox';
  const mapApiKey = collectionSettings?.get('mapApiKey');
  let mapLayers: Layer[] = props.layers || collectionSettings?.get('mapLayers')?.toJS();

  if (tilesProvider === 'google') {
    mapLayers = mapLayers?.filter(layer => layer !== 'Dark');
  }

  if (tilesProvider === 'google' && mapApiKey) {
    const loader = new Loader({
      apiKey: mapApiKey,
      retries: 0,
    });
    loader
      .load()
      .then(() => {})
      .catch(() => {});
  }

  const templatesInfo = templates.reduce(
    (info, t) => ({
      ...info,
      ...(t
        ? {
            [t.get('_id')]: {
              color: t.get('color'),
              name: t.get('name'),
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
      <LMap {...mapProps} />
    </ErrorBoundary>
  );
};

const container = connector(MapComponent);
export { container as Map };
export type { Layer };
