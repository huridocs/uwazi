import L, { TileLayer } from 'leaflet';
import 'leaflet.gridlayer.googlemutant';

const getGoogleLayer = (type: any) =>
  L.gridLayer.googleMutant({
    type,
    minZoom: 1,
    maxZoom: 20,
    zIndex: 0,
  }) as unknown as TileLayer;

export { getGoogleLayer };
