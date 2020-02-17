import { generateNames, generateIds, getUpdatedNames, getDeletedProperties } from '../utils';

describe('templates utils', () => {
  describe('generateNames()', () => {
    it('should sanitize the labels and append the type', () => {
      const properties = [
        { label: ' my prop ', type: 'text' },
        { label: 'my^foreïgn$próp"', type: 'text' },
        { label: ' my prop ', type: 'geolocation' },
      ];
      const result = generateNames(properties);
      expect(result[0].name).toBe('my_prop');
      expect(result[1].name).toBe('my_fore_gn_pr_p_');
      expect(result[2].name).toBe('my_prop_geolocation');
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

    it('should work for sub values too', () => {
      const oldProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'my_prop_two', values: [{ id: 3, name: 'look_at_me' }] },
      ];
      const newProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'my_prop_two', values: [{ id: 3, name: 'I_changed' }] },
      ];

      const result = getUpdatedNames(oldProperties, newProperties);
      expect(result).toEqual({ look_at_me: 'I_changed' });
    });
  });

  describe('getDeletedProperties()', () => {
    it('should return the properties that have been deleted', () => {
      const oldProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'boromir' },
      ];
      const newProperties = [{ id: 1, name: 'I_just_changed_my_name' }];

      const result = getDeletedProperties(oldProperties, newProperties);
      expect(result).toEqual(['boromir']);
    });

    it('should check sub values too', () => {
      const oldProperties = [
        { id: 1, name: 'my_prop' },
        { id: 2, name: 'my_prop_two', values: [{ id: 3, name: 'boromir' }] },
      ];
      const newProperties = [
        { id: 2, name: 'my_prop_two', values: [] },
        { id: 4, name: 'vip', values: [{ id: 1, name: 'my_prop' }] },
      ];
      const result = getDeletedProperties(oldProperties, newProperties);
      expect(result).toEqual(['boromir']);
    });
  });
});
