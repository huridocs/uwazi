import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IStore } from 'app/istore';
import { LMap } from 'app/Map/index';

interface MapComponentProps {
  onClick: () => {};
  tilesProvider: string;
}

const mapStateToProps = ({ settings, templates }: IStore) => ({
  collectionSettings: settings.collection,
  templates,
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MapComponentProps & mappedProps;

const MapComponent = ({ collectionSettings, templates, ...props }: ComponentProps) => {
  const startingPoint = collectionSettings?.get('mapStartingPoint')?.toJS();
  const mapProvider =
    props.tilesProvider || collectionSettings?.get('tilesProvider') || 'opengoogle';
  const token = collectionSettings?.get('mapApiKey');
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
  const mapProps = { ...props, startingPoint, mapProvider, token, templatesInfo };
  return <LMap {...mapProps} />;
};

const container = connector(MapComponent);
export { container as Map };
