import L, { TileLayer } from 'leaflet';
import { Loader } from '@googlemaps/js-api-loader';
import 'leaflet.gridlayer.googlemutant';

let googleMapsLoading: Promise<void> | undefined;

// GoogleMutant renders tiles through Google's own Maps JavaScript API, so the
// API (and therefore the key) must be loaded before any layer is constructed.
// Single-flight: concurrent maps share one load; a failed load can be retried.
const ensureGoogleMaps = async (apiKey?: string): Promise<void> => {
  if ((window as any).google?.maps) {
    return;
  }
  if (!apiKey) {
    throw new Error(
      'The Google tiles provider requires a Maps API key. Set "Map API key" in Settings > Collection.'
    );
  }
  if (!googleMapsLoading) {
    googleMapsLoading = new Loader({ apiKey, retries: 1 })
      .load()
      .then(() => undefined)
      .catch((err: unknown) => {
        googleMapsLoading = undefined;
        throw err;
      });
  }
  return googleMapsLoading;
};

const getGoogleLayer = (type: any) => {
  if (typeof (L.gridLayer as any).googleMutant !== 'function') {
    throw new Error('leaflet.gridlayer.googlemutant is not registered on Leaflet');
  }
  return (L.gridLayer as any).googleMutant({
    type,
    minZoom: 1,
    maxZoom: 20,
    zIndex: 0,
  }) as unknown as TileLayer;
};

export { ensureGoogleMaps, getGoogleLayer };
