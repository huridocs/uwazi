const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

type GeolocationCoordinates = {
  lat?: number;
  lon?: number;
};

const isFiniteNumber = (coord?: number): coord is number =>
  typeof coord === 'number' && Number.isFinite(coord);

const isValidLatitude = (lat?: number): lat is number =>
  isFiniteNumber(lat) && lat >= LATITUDE_MIN && lat <= LATITUDE_MAX;

const isValidLongitude = (lon?: number): lon is number =>
  isFiniteNumber(lon) && lon >= LONGITUDE_MIN && lon <= LONGITUDE_MAX;

const isValidGeolocationPair = (
  value?: GeolocationCoordinates
): value is { lat: number; lon: number } =>
  isValidLatitude(value?.lat) && isValidLongitude(value?.lon);

const parseCoordinate = (raw: string): number | undefined => {
  if (raw.trim() === '') {
    return undefined;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const clampLatitude = (lat: number): number => Math.min(LATITUDE_MAX, Math.max(LATITUDE_MIN, lat));

const clampLongitude = (lon: number): number =>
  Math.min(LONGITUDE_MAX, Math.max(LONGITUDE_MIN, lon));

export {
  LATITUDE_MIN,
  LATITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_MAX,
  isFiniteNumber,
  isValidLatitude,
  isValidLongitude,
  isValidGeolocationPair,
  parseCoordinate,
  clampLatitude,
  clampLongitude,
};
export type { GeolocationCoordinates };
