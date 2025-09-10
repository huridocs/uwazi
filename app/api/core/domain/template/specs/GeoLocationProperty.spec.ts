import { GeolocationProperty } from '../GeoLocationProperty';

describe('GeoLocationProperty', () => {
  it('should include geolocation type at the end of the PropertyName', () => {
    const geolocationProperty = new GeolocationProperty({
      id: 'any_id',
      label: 'A label',
      type: 'geolocation',
      template: 'any',
    });

    expect(geolocationProperty.name).toBe('a_label_geolocation');
  });

  it('should not generate a PropertyName if one is provided', () => {
    const geolocationProperty = new GeolocationProperty({
      id: 'any_id',
      label: 'A label',
      type: 'geolocation',
      name: 'a_label_2_geolocation',
      template: 'any',
    });

    expect(geolocationProperty.name).toBe('a_label_2_geolocation');
  });
});
