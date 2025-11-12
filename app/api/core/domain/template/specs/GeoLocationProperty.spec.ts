import { GeolocationProperty } from '../GeoLocationProperty';
import { PropertyTypeEnum } from '../PropertyType';

describe('GeoLocationProperty', () => {
  it('should include geolocation type at the end of the PropertyName', () => {
    const geolocationProperty = new GeolocationProperty({
      id: 'any_id',
      label: 'A label',
      type: PropertyTypeEnum.Geolocation,
      template: 'any',
    });

    expect(geolocationProperty.name).toBe('a_label_geolocation');
  });

  it('should not generate a PropertyName if one is provided', () => {
    const geolocationProperty = new GeolocationProperty({
      id: 'any_id',
      label: 'A label',
      type: PropertyTypeEnum.Geolocation,
      name: 'a_label_2_geolocation',
      template: 'any',
    });

    expect(geolocationProperty.name).toBe('a_label_2_geolocation');
  });

  describe('createPropertyAssignment', () => {
    it('should create assignment with a single geolocation value', () => {
      const prop = new GeolocationProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = prop.createPropertyAssignment({
        value: [{ value: { lat: 10, lon: 20, label: 'Point A' } }],
      });

      expect(assignment).toEqual({
        name: prop.name,
        type: prop.type,
        value: [{ value: { lat: 10, lon: 20, label: 'Point A' } }],
      });
    });

    it('should allow empty value when not required', () => {
      const prop = new GeolocationProperty({ id: 'any_id', label: 'A label', template: 'any' });

      const assignment = prop.createPropertyAssignment({ value: [] });

      expect(assignment).toEqual({ name: prop.name, type: prop.type, value: [] });
    });

    it('should throw if required and no value is provided', () => {
      const prop = new GeolocationProperty({
        id: 'any_id',
        label: 'A label',
        template: 'any',
        required: true,
      });

      expect(() => prop.createPropertyAssignment({ value: [] }, true)).toThrow(
        'Geolocation Property is required'
      );
    });

    it('should throw if latitude or longitude are invalid', () => {
      const prop = new GeolocationProperty({ id: 'any_id', label: 'A label', template: 'any' });

      expect(() =>
        prop.createPropertyAssignment({ value: [{ value: { lat: '10' as any, lon: 20 } }] })
      ).toThrow();

      expect(() =>
        prop.createPropertyAssignment({ value: [{ value: { lat: 10, lon: '20' as any } }] })
      ).toThrow();

      expect(() =>
        prop.createPropertyAssignment({ value: [{ value: { lat: undefined as any, lon: 29 } }] })
      ).toThrow();

      expect(() =>
        prop.createPropertyAssignment({ value: [{ value: { lat: 20, lon: undefined as any } }] })
      ).toThrow();
    });
  });
});
