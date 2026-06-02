/* eslint-disable max-statements */
import {
  AmountPerSlotType,
  SlotBootstrapDefinitions,
} from '../entities/SlotBootstrapDefinitions.js';

describe('SlotBootstrapDefinitions', () => {
  describe('createSlotName()', () => {
    describe('basic formatting', () => {
      it('creates slot name with 2-digit padding for single digit index', () => {
        expect(SlotBootstrapDefinitions.createSlotName('txt', 1)).toBe('txt_01');
      });

      it('creates slot name with 2-digit padding for two digit index', () => {
        expect(SlotBootstrapDefinitions.createSlotName('txt', 10)).toBe('txt_10');
      });

      it('does not truncate 3+ digit indexes', () => {
        expect(SlotBootstrapDefinitions.createSlotName('txt', 100)).toBe('txt_100');
      });
    });

    describe('different slot types', () => {
      it('creates slot name for date slot type', () => {
        expect(SlotBootstrapDefinitions.createSlotName('date', 1)).toBe('date_01');
      });

      it('creates slot name for relationship_txt slot type', () => {
        expect(SlotBootstrapDefinitions.createSlotName('relationship_txt', 1)).toBe(
          'relationship_txt_01'
        );
      });

      it('creates slot name for geolocation slot type', () => {
        expect(SlotBootstrapDefinitions.createSlotName('geolocation', 5)).toBe('geolocation_05');
      });
    });

    describe('edge cases', () => {
      it('handles large index numbers', () => {
        expect(SlotBootstrapDefinitions.createSlotName('txt', 1000)).toBe('txt_1000');
      });

      it('pads correctly for 99 index', () => {
        expect(SlotBootstrapDefinitions.createSlotName('num', 99)).toBe('num_99');
      });
    });
  });

  describe('slotList()', () => {
    it('returns an array', () => {
      expect(Array.isArray(SlotBootstrapDefinitions.slotList())).toBe(true);
    });

    it('contains no duplicates', () => {
      const list = SlotBootstrapDefinitions.slotList();
      const uniqueList = [...new Set(list)];
      expect(list.length).toBe(uniqueList.length);
    });

    it('contains all 13 slot types', () => {
      const list = SlotBootstrapDefinitions.slotList();
      const expectedSlotTypes = [
        'txt',
        'date',
        'num',
        'range',
        'select',
        'relationship',
        'geolocation',
        'relationship_txt',
        'relationship_num',
        'relationship_date',
        'relationship_range',
        'relationship_select',
        'relationship_geolocation',
      ];

      expectedSlotTypes.forEach(slotType => {
        expect(list).toContain(slotType);
      });

      expect(list.length).toBe(expectedSlotTypes.length);
    });

    it('does not mutate internal state when called multiple times', () => {
      const firstCall = SlotBootstrapDefinitions.slotList();
      const secondCall = SlotBootstrapDefinitions.slotList();

      expect(firstCall).toEqual(secondCall);
      expect(firstCall).not.toBe(secondCall); // Different array instances
    });
  });

  describe('AmountPerSlotType', () => {
    it('has 150 slots for txt', () => {
      expect(AmountPerSlotType.txt).toBe(150);
    });

    it('has 150 slots for relationship_txt', () => {
      expect(AmountPerSlotType.relationship_txt).toBe(150);
    });

    it('has 50 slots for date', () => {
      expect(AmountPerSlotType.date).toBe(50);
    });

    it('has 50 slots for num', () => {
      expect(AmountPerSlotType.num).toBe(50);
    });

    it('has 50 slots for range', () => {
      expect(AmountPerSlotType.range).toBe(50);
    });

    it('has 50 slots for select', () => {
      expect(AmountPerSlotType.select).toBe(50);
    });

    it('has 50 slots for relationship', () => {
      expect(AmountPerSlotType.relationship).toBe(50);
    });

    it('has 50 slots for geolocation', () => {
      expect(AmountPerSlotType.geolocation).toBe(50);
    });

    it('has 50 slots for relationship_num', () => {
      expect(AmountPerSlotType.relationship_num).toBe(50);
    });

    it('has 50 slots for relationship_date', () => {
      expect(AmountPerSlotType.relationship_date).toBe(50);
    });

    it('has 50 slots for relationship_range', () => {
      expect(AmountPerSlotType.relationship_range).toBe(50);
    });

    it('has 50 slots for relationship_select', () => {
      expect(AmountPerSlotType.relationship_select).toBe(50);
    });

    it('has 50 slots for relationship_geolocation', () => {
      expect(AmountPerSlotType.relationship_geolocation).toBe(50);
    });

    it('has an entry for every SlotType returned by slotList()', () => {
      const slotList = SlotBootstrapDefinitions.slotList();
      slotList.forEach(slotType => {
        expect(AmountPerSlotType[slotType]).toBeDefined();
        expect(typeof AmountPerSlotType[slotType]).toBe('number');
      });
    });

    it('exhaustiveness check: no SlotType is missing', () => {
      const expectedSlotTypes = [
        'txt',
        'date',
        'num',
        'range',
        'select',
        'relationship',
        'geolocation',
        'relationship_txt',
        'relationship_num',
        'relationship_date',
        'relationship_range',
        'relationship_select',
        'relationship_geolocation',
      ] as const;

      expectedSlotTypes.forEach(slotType => {
        expect(AmountPerSlotType[slotType]).toBeDefined();
      });
    });
  });
});
