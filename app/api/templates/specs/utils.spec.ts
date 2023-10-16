import db from 'api/utils/testing_db';
import { PropertySchema } from 'shared/types/commonTypes';
import settings from 'api/settings/settings';
import {
  generateIds,
  getUpdatedNames,
  getDeletedProperties,
  generateNames,
  PropertyOrThesaurusSchema,
} from '../utils';

describe('templates utils', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad({});
  });

  describe('name generation', () => {
    describe('default name generation', () => {
      it('should sanitize the labels and append the type', async () => {
        await settings.save({});
        const result = await generateNames([
          { label: ' my prop ', name: '', type: 'text' },
          { label: 'my^foreïgn$próp"', name: '', type: 'text' },
          { label: ' my prop ', name: '', type: 'geolocation' },
        ]);

        expect(result[0].name).toBe('my_prop');
        expect(result[1].name).toBe('my_fore_gn_pr_p_');
        expect(result[2].name).toBe('my_prop_geolocation');
      });
    });

    describe('less restrictive name generation', () => {
      it('should not contain the characters #, \\, /, *, ?, ", <, >, |, , :, ., and should be lowercase', async () => {
        await settings.save({ newNameGeneration: true });
        const result = await generateNames([
          { label: ' my prop ', name: '', type: 'text' },
          { label: 'my^foreïgn$próp"', name: '', type: 'text' },
          { label: ' my prop ', name: '', type: 'geolocation' },
          { label: 'TEST#', name: '', type: 'text' },
          { label: 'test\\', name: '', type: 'text' },
          { label: 'test/', name: '', type: 'text' },
          { label: '*test*', name: '', type: 'text' },
          { label: 'test?', name: '', type: 'text' },
          { label: 'test"', name: '', type: 'text' },
          { label: 'test<', name: '', type: 'text' },
          { label: 'test>', name: '', type: 'text' },
          { label: 'test|', name: '', type: 'text' },
          { label: 'te st ', name: '', type: 'text' },
          { label: 'test: ', name: '', type: 'text' },
          { label: 'te.st. ', name: '', type: 'text' },
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
        const result = await generateNames([
          { label: '.test ', name: '', type: 'text' },
          { label: '_test', name: '', type: 'text' },
          { label: '+test', name: '', type: 'text' },
          { label: '$test', name: '', type: 'text' },
          { label: '-test', name: '', type: 'text' },
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
    it('should generate unique IDs for thesauri without them', () => {
      const result = generateIds([{ name: 'entry 1' }, { name: 'entry 2', id: '123' }]);
      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBe('123');
    });
  });

  describe('getUpdatedNames()', () => {
    it('should return the properties that have a new name', () => {
      const prop1Id = db.id();
      const prop2Id = db.id();
      const oldProperties: PropertySchema[] = [
        { _id: prop1Id, name: 'my_prop', label: 'label', type: 'text' },
        { _id: prop2Id, name: 'my_prop_two', label: 'label', type: 'text' },
      ];

      const newProperties: PropertySchema[] = [
        { _id: prop1Id, name: 'my_prop', label: 'label', type: 'text' },
        { _id: prop2Id, name: 'my_fancy_new_name', label: 'label', type: 'text' },
      ];

      const result = getUpdatedNames(
        {
          prop: 'name',
          outKey: 'name',
          filterBy: '_id',
        },
        oldProperties,
        newProperties
      );
      expect(result).toEqual({ my_prop_two: 'my_fancy_new_name' });
    });

    it('should work for sub values too (function is being used by relationships and thesauri)', () => {
      const oldProperties: PropertyOrThesaurusSchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',
          values: [{ id: '3', label: 'look at me', name: 'look_at_me' }],
          label: 'label',
          type: 'text',
        },
      ];

      const newProperties: PropertyOrThesaurusSchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',

          values: [{ id: '3', label: 'I changed', name: 'I_changed' }],
          label: 'label',
          type: 'text',
        },
      ];

      const result = getUpdatedNames(
        {
          prop: 'name',
          outKey: 'name',
          filterBy: 'id',
        },
        oldProperties,
        newProperties
      );
      expect(result).toEqual({ look_at_me: 'I_changed' });
    });
  });

  describe('getDeletedProperties()', () => {
    it('should return the properties that have been deleted', () => {
      const propId = db.id();
      const oldProperties: PropertySchema[] = [
        { _id: propId, name: 'my_prop', label: 'label', type: 'text' },
        { _id: db.id(), name: 'boromir', label: 'label', type: 'text' },
      ];
      const changedProperties: PropertySchema[] = [
        { _id: propId, name: 'I_just_changed_my_name', label: 'label', type: 'text' },
      ];

      const result = getDeletedProperties(oldProperties, changedProperties, '_id');
      expect(result).toEqual(['boromir']);
    });

    it('should check sub values too', () => {
      const oldProperties: PropertyOrThesaurusSchema[] = [
        { id: '1', name: 'my_prop', label: 'label', type: 'text' },
        {
          id: '2',
          name: 'my_prop_two',
          values: [{ id: '3', label: 'boromir', name: 'boromir' }],
          label: 'label',
          type: 'text',
        },
      ];
      const newProperties: PropertyOrThesaurusSchema[] = [
        { id: '2', name: 'my_prop_two', values: [], label: 'label', type: 'text' },
        {
          id: '4',
          name: 'vip',
          values: [{ id: '1', label: 'my prop', name: 'my_prop' }],
          label: 'label',
          type: 'text',
        },
      ];

      const result = getDeletedProperties(oldProperties, newProperties, 'id');
      expect(result).toEqual(['boromir']);
    });

    it('should not return properties, where the label/name is still used in another element', () => {
      const oldProperties: PropertyOrThesaurusSchema[] = [
        { id: '1', label: 'label' },
        { id: '2', label: 'label' },
        { id: '3', label: 'another label' },
        { id: '4', label: 'last label' },
      ];
      const newProperties: PropertyOrThesaurusSchema[] = [
        { id: '1', label: 'label' },
        { id: '3', label: 'another label' },
      ];

      const result = getDeletedProperties(oldProperties, newProperties, 'id', 'label');
      expect(result).toEqual(['last label']);
    });
  });
});

afterAll(async () => db.disconnect());
