import db from 'api/utils/testing_db';
import { PropertySchema } from 'shared/types/commonTypes';
import settings from 'api/settings/settings';
import { generateIds, getUpdatedNames, getDeletedProperties, generateNamesAndIds } from '../utils';

describe('templates utils', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad({});
  });

  describe('name generation', () => {
    describe('default name generation', () => {
      it('should sanitize the labels and append the type', async () => {
        await settings.save({});
        const result = await generateNamesAndIds([
          { label: ' my prop ', type: 'text' },
          { label: 'my^foreïgn$próp"', type: 'text' },
          { label: ' my prop ', type: 'geolocation' },
        ]);

        expect(result[0].name).toBe('my_prop');
        expect(result[1].name).toBe('my_fore_gn_pr_p_');
        expect(result[2].name).toBe('my_prop_geolocation');
      });
    });

    describe('less restrictive name generation', () => {
      it('should not contain the characters #, \\, /, *, ?, ", <, >, |, , :, ., and should be lowercase', async () => {
        await settings.save({ newNameGeneration: true });
        const result = await generateNamesAndIds([
          { label: ' my prop ', type: 'text' },
          { label: 'my^foreïgn$próp"', type: 'text' },
          { label: ' my prop ', type: 'geolocation' },
          { label: 'TEST#', type: 'text' },
          { label: 'test\\', type: 'text' },
          { label: 'test/', type: 'text' },
          { label: '*test*', type: 'text' },
          { label: 'test?', type: 'text' },
          { label: 'test"', type: 'text' },
          { label: 'test<', type: 'text' },
          { label: 'test>', type: 'text' },
          { label: 'test|', type: 'text' },
          { label: 'te st ', type: 'text' },
          { label: 'test: ', type: 'text' },
          { label: 'te.st. ', type: 'text' },
        ]);

        expect(result).toEqual([
          expect.objectContaining({ name: 'my_prop' }),
          expect.objectContaining({ name: 'my^foreïgn$próp_' }),
          expect.objectContaining({ name: 'my_prop_geolocation' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'te_st' }),
          expect.objectContaining({ name: 'test_' }),
          expect.objectContaining({ name: 'te_st_' }),
        ]);
      });

      it('should not start with _, -, +, $', async () => {
        await settings.save({ newNameGeneration: true });
        const result = await generateNamesAndIds([
          { label: '.test ', type: 'text' },
          { label: '_test', type: 'text' },
          { label: '+test', type: 'text' },
          { label: '$test', type: 'text' },
          { label: '-test', type: 'text' },
        ]);

        expect(result).toEqual([
          expect.objectContaining({ name: 'test' }),
          expect.objectContaining({ name: 'test' }),
          expect.objectContaining({ name: 'test' }),
          expect.objectContaining({ name: 'test' }),
          expect.objectContaining({ name: 'test' }),
        ]);
      });
    });
  });

  describe('generateIds()', () => {
    it('should generate unique IDs for properties without them', () => {
      const result = generateIds([{}, { id: '123' }] as PropertySchema[]);
      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBe('123');
    });
  });

  describe('getUpdatedNames()', () => {
    it('should return the properties that have a new name', () => {
      const oldProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        { id: '2', name: 'my_prop_two', label: 'label', type: 'text' },
      ];

      const newProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        { id: '2', name: 'my_fancy_new_name', label: 'label', type: 'text' },
      ];

      const result = getUpdatedNames(oldProperties, newProperties);
      expect(result).toEqual({ my_prop_two: 'my_fancy_new_name' });
    });

    it('should work for sub values too', () => {
      const oldProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',
          values: [{ id: 3, name: 'look_at_me' }],
          label: 'label',
          type: 'text',
        },
      ];

      const newProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',
          values: [{ id: 3, name: 'I_changed' }],
          label: 'label',
          type: 'text',
        },
      ];

      const result = getUpdatedNames(oldProperties, newProperties);
      expect(result).toEqual({ look_at_me: 'I_changed' });
    });
  });

  describe('getDeletedProperties()', () => {
    it('should return the properties that have been deleted', () => {
      const oldProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        { id: '2', name: 'boromir', label: 'label', type: 'text' },
      ];
      const newProperties: PropertySchema[] = [
        { id: '1', name: 'I_just_changed_my_name', label: 'label', type: 'text' },
      ];

      const result = getDeletedProperties(oldProperties, newProperties);
      expect(result).toEqual(['boromir']);
    });

    it('should check sub values too', () => {
      const oldProperties: PropertySchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',
          values: [{ id: 3, name: 'boromir' }],
          label: 'label',
          type: 'text',
        },
      ];
      const newProperties: PropertySchema[] = [
        { id: '2', name: 'my_prop_two', values: [], label: 'label', type: 'text' },
        {
          id: '4',
          name: 'vip',
          values: [{ id: '1', name: 'my_prop' }],
          label: 'label',
          type: 'text',
        },
      ];

      const result = getDeletedProperties(oldProperties, newProperties);
      expect(result).toEqual(['boromir']);
    });
  });
});
