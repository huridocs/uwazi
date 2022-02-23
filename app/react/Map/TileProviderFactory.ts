import L, { TileLayer } from 'leaflet';

const mapBoxStyles: { [k: string]: string } = {
  streets: 'mapbox/streets-v11',
  satelliteStreets: 'mapbox/satellite-streets-v11',
  satellite: 'mapbox/satellite-v9',
  outdoors: 'mapbox/outdoors-v11',
  light: 'mapbox/light-v10',
  dark: 'mapbox/dark-v10',
  navigationDay: 'mapbox/navigation-day-v1',
  navigationNight: 'mapbox/navigation-night-v1',
};

const GoogleMapStyles: { [k: string]: string } = {
  maps: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
  satellite: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
  hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  terrain: 'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}',
  traffic:
    'https://mt1.google.com/vt?lyrs=h@159000000,traffic|seconds_into_week:-1&style=3&x={x}&y={y}&z={z}',
  roads: 'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
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
