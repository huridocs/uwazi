import { t } from '#app/I18N/index.js';
import {
  isFiniteNumber,
  isValidLatitude,
  isValidLongitude,
  type GeolocationCoordinates,
} from '#shared/geolocationCoordinates.js';

const hasFinitePair = (value?: GeolocationCoordinates): value is { lat: number; lon: number } =>
  isFiniteNumber(value?.lat) && isFiniteNumber(value?.lon);

const validateGeolocationValue = (
  value: GeolocationCoordinates | undefined,
  required: boolean
): true | string => {
  if (!hasFinitePair(value)) {
    if (!isFiniteNumber(value?.lat) && !isFiniteNumber(value?.lon)) {
      return required ? t('System', 'Required', null, false) : true;
    }
    return t('System', 'Required', null, false);
  }

  if (!isValidLatitude(value.lat)) {
    return t('System', 'Latitude must be between -90 and 90', null, false);
  }

  if (!isValidLongitude(value.lon)) {
    return t('System', 'Longitude must be between -180 and 180', null, false);
  }

  return true;
};

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
} from '#shared/geolocationCoordinates.js';
export type { GeolocationCoordinates } from '#shared/geolocationCoordinates.js';
export { validateGeolocationValue };
