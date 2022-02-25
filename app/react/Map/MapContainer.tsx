import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IStore } from 'app/istore';
import { LMap, RMap } from 'app/Map/index';

interface MapComponentProps {
  onClick: () => {};
}

const mapStateToProps = ({ settings }: IStore) => ({
  collectionSettings: settings.collection,
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MapComponentProps & mappedProps;

const MapComponent = ({ collectionSettings, ...props }: ComponentProps) => {
  const startingPoint = collectionSettings?.get('mapStartingPoint')?.toJS();
  const mapProvider = collectionSettings?.get('tilesProvider') || 'google';
  const token = collectionSettings?.get('mapTilerKey');
  const mapProps = { ...props, startingPoint, mapProvider, token };
  return mapProvider === 'openmaptiles' ? <RMap {...mapProps} /> : <LMap {...mapProps} />;
};

const container = connector(MapComponent);
export { container as Map };
