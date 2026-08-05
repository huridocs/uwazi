import {
  clampLatitude,
  clampLongitude,
  isValidGeolocationPair,
  isValidLatitude,
  isValidLongitude,
  parseCoordinate,
} from '#shared/geolocationCoordinates.js';
import { validateGeolocationValue } from '../geolocationCoordinates.js';

describe('geolocationCoordinates', () => {
  it('accepts WGS 84 / ISO 6709 inclusive latitude and longitude bounds', () => {
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(0)).toBe(true);
  });

  it('rejects out-of-range and non-finite coordinates', () => {
    expect(isValidLatitude(-90.0001)).toBe(false);
    expect(isValidLatitude(90.0001)).toBe(false);
    expect(isValidLongitude(-180.0001)).toBe(false);
    expect(isValidLongitude(180.0001)).toBe(false);
    expect(isValidLatitude(Number.NaN)).toBe(false);
    expect(isValidLongitude(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('clamps coordinates to inclusive WGS 84 bounds', () => {
    expect(clampLatitude(-91)).toBe(-90);
    expect(clampLatitude(91)).toBe(90);
    expect(clampLatitude(-90)).toBe(-90);
    expect(clampLongitude(-181)).toBe(-180);
    expect(clampLongitude(181)).toBe(180);
    expect(clampLongitude(180)).toBe(180);
  });

  it('validates complete coordinate pairs only when both axes are in range', () => {
    expect(isValidGeolocationPair({ lat: 40.7, lon: -74 })).toBe(true);
    expect(isValidGeolocationPair({ lat: 91, lon: 0 })).toBe(false);
    expect(isValidGeolocationPair({ lat: 0, lon: 181 })).toBe(false);
    expect(isValidGeolocationPair({ lat: 10 })).toBe(false);
  });

  it('parses input strings and validates optional/required form values', () => {
    expect(parseCoordinate('')).toBeUndefined();
    expect(parseCoordinate(' 12.5 ')).toBe(12.5);
    expect(parseCoordinate('abc')).toBeUndefined();

    expect(validateGeolocationValue(undefined, false)).toBe(true);
    expect(validateGeolocationValue(undefined, true)).toBe('Required');
    expect(validateGeolocationValue({ lat: 10 }, false)).toBe('Required');
    expect(validateGeolocationValue({ lat: 91, lon: 10 }, false)).toBe(
      'Latitude must be between -90 and 90'
    );
    expect(validateGeolocationValue({ lat: 10, lon: -181 }, false)).toBe(
      'Longitude must be between -180 and 180'
    );
    expect(validateGeolocationValue({ lat: 10, lon: 10 }, false)).toBe(true);
  });
});
