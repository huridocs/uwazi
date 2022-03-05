import L, { TileLayer } from 'leaflet';
import 'leaflet.gridlayer.googlemutant';

const mapBoxStyles: { [k: string]: string } = {
  Streets: 'mapbox/streets-v11',
  Satellite: 'mapbox/satellite-v9',
  Hybrid: 'mapbox/satellite-streets-v11',
};

const OpenGoogleMapStyles: { [k: string]: string } = {
  Streets: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  Satellite: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
  Hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
};

const GoogleMapStyles: { [k: string]: 'roadmap' | 'satellite' | 'hybrid' } = {
  Streets: 'roadmap',
  Satellite: 'satellite',
  Hybrid: 'hybrid',
};

const getGoogleLayers: () => { [p: string]: TileLayer } = () =>
  Object.keys(GoogleMapStyles).reduce(
    (layers: { [k: string]: any }, styleId: string) => ({
      ...layers,
      [styleId]: L.gridLayer.googleMutant({
        type: GoogleMapStyles[styleId],
        minZoom: 1,
        maxZoom: 20,
      }) as unknown as TileLayer,
    }),
    {}
  );

const getOpenGoogleLayers: () => { [p: string]: TileLayer } = () =>
  Object.keys(OpenGoogleMapStyles).reduce(
    (layers: { [k: string]: TileLayer }, styleId: string) => ({
      ...layers,
      [styleId]: L.tileLayer(OpenGoogleMapStyles[styleId]),
    }),
    {}
  );

const getMapboxLayers: () => { [p: string]: TileLayer } = () => {
  const mapboxUrl =
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
  return Object.keys(mapBoxStyles).reduce(
    (layers: { [k: string]: TileLayer }, styleId: string) => ({
      ...layers,
      [styleId]: L.tileLayer(mapboxUrl, {
        id: mapBoxStyles[styleId],
        tileSize: 512,
        zoomOffset: -1,
        accessToken:
          'pk.eyJ1IjoibWVyY3lmIiwiYSI6ImNrem9veGlpNTYxd2gyb25rc25heW8xMjEifQ.il5fhMnZYsZXK69KK9WfeQ',
      }),
    }),
    {}
  );
};

const mapFunction: { [k: string]: () => { [p: string]: TileLayer } } = {
  opengoogle: getOpenGoogleLayers,
  google: getGoogleLayers,
  mapbox: getMapboxLayers,
};
const getMapProvider = (provider: string) => {
  const mapLayers = mapFunction[provider]();
  return { layers: Object.values(mapLayers), baseMaps: mapLayers };
};

export { getMapProvider };
