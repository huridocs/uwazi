/* eslint-disable max-statements */
import { SlotTypeRegistry } from '../entities/SlotTypeRegistry.js';

describe('SlotTypeRegistry', () => {
  describe('toSlotType()', () => {
    describe('txt family', () => {
      it('maps text to txt', () => {
        expect(SlotTypeRegistry.toSlotType('text')).toBe('txt');
      });

      it('maps link to txt', () => {
        expect(SlotTypeRegistry.toSlotType('link')).toBe('txt');
      });

      it('maps markdown to txt', () => {
        expect(SlotTypeRegistry.toSlotType('markdown')).toBe('txt');
      });

      it('maps generatedid to txt', () => {
        expect(SlotTypeRegistry.toSlotType('generatedid')).toBe('txt');
      });
    });

    describe('date family', () => {
      it('maps date to date', () => {
        expect(SlotTypeRegistry.toSlotType('date')).toBe('date');
      });

      it('maps multidate to date', () => {
        expect(SlotTypeRegistry.toSlotType('multidate')).toBe('date');
      });
    });

    describe('num family', () => {
      it('maps numeric to num', () => {
        expect(SlotTypeRegistry.toSlotType('numeric')).toBe('num');
      });
    });

    describe('range family', () => {
      it('maps daterange to range', () => {
        expect(SlotTypeRegistry.toSlotType('daterange')).toBe('range');
      });

      it('maps multidaterange to range', () => {
        expect(SlotTypeRegistry.toSlotType('multidaterange')).toBe('range');
      });
    });

    describe('select family', () => {
      it('maps select to select', () => {
        expect(SlotTypeRegistry.toSlotType('select')).toBe('select');
      });

      it('maps multiselect to select', () => {
        expect(SlotTypeRegistry.toSlotType('multiselect')).toBe('select');
      });
    });

    describe('relationship family', () => {
      it('maps relationship to relationship', () => {
        expect(SlotTypeRegistry.toSlotType('relationship')).toBe('relationship');
      });

      it('maps relationship_relationship to relationship', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'relationship')).toBe('relationship');
      });
    });

    describe('relationship_txt family', () => {
      it('maps relationship_text to relationship_txt', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'text')).toBe('relationship_txt');
      });

      it('maps relationship_markdown to relationship_txt', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'markdown')).toBe('relationship_txt');
      });

      it('maps relationship_generatedid to relationship_txt', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'generatedid')).toBe('relationship_txt');
      });

      it('maps relationship_link to relationship_txt', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'link')).toBe('relationship_txt');
      });
    });

    describe('relationship_num family', () => {
      it('maps relationship_numeric to relationship_num', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'numeric')).toBe('relationship_num');
      });
    });

    describe('relationship_date family', () => {
      it('maps relationship_date to relationship_date', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'date')).toBe('relationship_date');
      });

      it('maps relationship_multidate to relationship_date', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'multidate')).toBe('relationship_date');
      });
    });

    describe('relationship_range family', () => {
      it('maps relationship_daterange to relationship_range', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'daterange')).toBe('relationship_range');
      });

      it('maps relationship_multidaterange to relationship_range', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'multidaterange')).toBe(
          'relationship_range'
        );
      });
    });

    describe('relationship_select family', () => {
      it('maps relationship_select to relationship_select', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'select')).toBe('relationship_select');
      });

      it('maps relationship_multiselect to relationship_select', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'multiselect')).toBe(
          'relationship_select'
        );
      });
    });

    describe('relationship_geolocation family', () => {
      it('maps relationship_geolocation to relationship_geolocation', () => {
        expect(SlotTypeRegistry.toSlotType('relationship', 'geolocation')).toBe(
          'relationship_geolocation'
        );
      });
    });

    describe('geolocation family', () => {
      it('maps geolocation to geolocation', () => {
        expect(SlotTypeRegistry.toSlotType('geolocation')).toBe('geolocation');
      });
    });

    describe('unknown types', () => {
      it('returns undefined for unknown property type', () => {
        expect(SlotTypeRegistry.toSlotType('unknown_type' as any)).toBeUndefined();
      });

      it('returns undefined for empty string', () => {
        expect(SlotTypeRegistry.toSlotType('' as any)).toBeUndefined();
      });
    });
  });
});
