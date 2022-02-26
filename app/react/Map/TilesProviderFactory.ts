import L, { TileLayer } from 'leaflet';

const mapBoxStyles: { [k: string]: string } = {
  Streets: 'mapbox/streets-v11',
  Satellite: 'mapbox/satellite-v9',
  Hybrid: 'mapbox/satellite-streets-v11',
};

const GoogleMapStyles: { [k: string]: string } = {
  Streets: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
  Satellite: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
  Hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
};

const getGoogleLayers = () =>
  Object.keys(GoogleMapStyles).reduce(
    (layers: { [k: string]: TileLayer }, styleId: string) => ({
      ...layers,
      [styleId]: L.tileLayer(GoogleMapStyles[styleId]),
    }),
    {}
  );

const getMapboxLayers = () => {
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

interface MapProvider {
  layers: TileLayer[];
  baseMaps: { [k: string]: TileLayer };
}

const googleMapProvider: () => MapProvider = () => {
  const mapLayers = getGoogleLayers();
  return { layers: Object.values(getGoogleLayers()), baseMaps: mapLayers };
};

const mapBoxMapProvider: () => MapProvider = () => {
  const mapLayers = getMapboxLayers();
  return { layers: Object.values(getMapboxLayers()), baseMaps: mapLayers };
};

const getMapProvider = (provider: string) =>
  provider === 'google' ? googleMapProvider() : mapBoxMapProvider();

export { getMapProvider };
export type { MapProvider };
