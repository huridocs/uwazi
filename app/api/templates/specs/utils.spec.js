import { generateNames, generateIds, getUpdatedNames, getDeletedProperties } from '../utils';

describe('templates utils', () => {
  describe('generateNames()', () => {
    it('should sanitize the labels', () => {
      const properties = [
        { label: ' my prop ', type: 'text' },
        { label: 'my^foreïgn$próp"', type: 'text' }
      ];
      const result = generateNames(properties);
      expect(result[0].name).toBe('my_prop');
      expect(result[1].name).toBe('my_fore_gn_pr_p_');
    });

    it('should append a sufix for special properties', () => {
      const properties = [
        { label: ' my prop ', type: 'geolocation' }
      ];
      const result = generateNames(properties);
      expect(result[0].name).toBe('my_prop_geolocation');
    });
  });

  describe('generateIds()', () => {
    it('should generate unique IDs for properties without them', () => {
      const properties = [{}, { id: '123' }];
      const result = generateIds(properties);
      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBe('123');
    });
  });

  describe('getUpdatedNames()', () => {
    it('should return the properties that have a new name', () => {
      const oldProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'my_prop_two' },
      ];
      const newProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'my_fancy_new_name' },
      ];

      const result = getUpdatedNames(oldProperties, newProperties);
      expect(result).toEqual({ my_prop_two: 'my_fancy_new_name' });
    });
  });

  describe('getDeletedProperties()', () => {
    it('should return the properties that have been deleted', () => {
      const oldProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'boromir' },
      ];
      const newProperties = [
        { id: 1, name: 'I_just_changed_my_name' }
      ];

      const result = getDeletedProperties(oldProperties, newProperties);
      expect(result).toEqual(['boromir']);
    });
  });
});
