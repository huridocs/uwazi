import Leaflet, { TileLayer } from 'leaflet';
import { t } from '#app/I18N/index.js';
import { getGoogleLayer } from '#app/Map/GoogleMapLayer.js';

const osmAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
const esriAttribution =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const cartoAttribution = `${osmAttribution} &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>`;

const GoogleMapStyles: { [k: string]: 'roadmap' | 'satellite' | 'hybrid' } = {
  Streets: 'roadmap',
  Satellite: 'satellite',
  Hybrid: 'hybrid',
};

const getGoogleLayers: () => { [p: string]: { layer: TileLayer; key: string } } = () =>
  Object.keys(GoogleMapStyles).reduce(
    (layers: { [k: string]: any }, styleId: string) => ({
      ...layers,
      [styleId]: { layer: getGoogleLayer(GoogleMapStyles[styleId]), key: styleId },
    }),
    {}
  );

// Open, keyless tile sources. Streets/Dark are open data (OSM, CARTO);
// Satellite is Esri World Imagery — freely accessible and the de-facto
// standard satellite layer for Leaflet applications.
const getOpenLayers: (accessToken?: string) => {
  [p: string]: { layer: TileLayer; key: string };
} = () => {
  const streets = () =>
    Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: osmAttribution,
      zIndex: 0,
    });

  const imagery = () =>
    Leaflet.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: esriAttribution, zIndex: 0 }
    );

  const referenceLabels = () =>
    Leaflet.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Labels &copy; Esri', zIndex: 1 }
    );

  const dark = () =>
    Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: cartoAttribution,
      zIndex: 0,
    });

  const openLayers: { [k: string]: TileLayer } = {
    Streets: streets(),
    Satellite: imagery(),
    Hybrid: Leaflet.layerGroup([imagery(), referenceLabels()]) as unknown as TileLayer,
    Dark: dark(),
  };

  return Object.keys(openLayers).reduce(
    (layers: { [k: string]: { layer: TileLayer; key: string } }, styleId: string) => {
      const styleLabel = t('System', styleId, null, false);
      return { ...layers, [styleLabel]: { layer: openLayers[styleId], key: styleId } };
    },
    {}
  );
};

const mapFunction: {
  [k: string]: (accessToken?: string) => { [p: string]: { layer: TileLayer; key: string } };
} = {
  google: getGoogleLayers,
  osm: getOpenLayers,
  // Legacy settings value from when this provider was Mapbox-backed.
  mapbox: getOpenLayers,
};

const getMapProvider = (provider: string, mapApiKey?: string) => {
  const providerLayers = mapFunction[provider] || getOpenLayers;
  return providerLayers(mapApiKey);
};

export { getMapProvider };
