import L, { TileLayer } from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
import { t } from 'app/I18N';

const DEFAULT_MAPBOX_TOKEN =
  'pk.eyJ1IjoibWVyY3lmIiwiYSI6ImNrem9veGlpNTYxd2gyb25rc25heW8xMjEifQ.il5fhMnZYsZXK69KK9WfeQ';

const mapBoxStyles: { [k: string]: string } = {
  Streets: 'mapbox/streets-v11',
  Satellite: 'mapbox/satellite-v9',
  Hybrid: 'mapbox/satellite-streets-v11',
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

const getMapboxLayers: (accessToken?: string) => { [p: string]: TileLayer } = accessToken => {
  const mapboxUrl =
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
  return Object.keys(mapBoxStyles).reduce((layers: { [k: string]: TileLayer }, styleId: string) => {
    const styleLabel = t('System', styleId, null, false);
    return {
      ...layers,
      [styleLabel]: L.tileLayer(mapboxUrl, {
        id: mapBoxStyles[styleId],
        tileSize: 512,
        zoomOffset: -1,
        accessToken: accessToken || DEFAULT_MAPBOX_TOKEN,
      }),
    };
  }, {});
};

const mapFunction: { [k: string]: (accessToken?: string) => { [p: string]: TileLayer } } = {
  google: getGoogleLayers,
  mapbox: getMapboxLayers,
};
const getMapProvider = (provider: string, mapApiKey?: string) => {
  const mapLayers = mapFunction[provider](mapApiKey);
  return { layers: Object.values(mapLayers), baseMaps: mapLayers };
};

export { getMapProvider };
