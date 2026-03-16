import { PropertyType } from '#api/core/domain/template/PropertyType.js';

type SlotType =
  | 'txt'
  | 'date'
  | 'num'
  | 'range'
  | 'select'
  | 'relationship'
  | 'geolocation'
  | 'relationship_txt'
  | 'relationship_num'
  | 'relationship_date'
  | 'relationship_range'
  | 'relationship_select'
  | 'relationship_geolocation';

const AmountPerSlotType: Record<SlotType, number> = {
  txt: 100,
  date: 50,
  num: 50,
  range: 50,
  select: 50,
  relationship: 50,
  geolocation: 50,

  relationship_txt: 100,
  relationship_num: 50,
  relationship_date: 50,
  relationship_range: 50,
  relationship_select: 50,
  relationship_geolocation: 50,
};

class SlotsMapper {
  private static propertyTypeSlotTypeDictionary = new Map<string, SlotType>([
    ['text', 'txt'],
    ['link', 'txt'],
    ['markdown', 'txt'],
    ['generatedid', 'txt'],

    ['date', 'date'],
    ['multidate', 'date'],

    ['numeric', 'num'],

    ['daterange', 'range'],
    ['multidaterange', 'range'],

    ['select', 'select'],
    ['multiselect', 'select'],

    ['relationship', 'relationship'],
    ['relationship_relationship', 'relationship'],

    ['relationship_text', 'relationship_txt'],
    ['relationship_markdown', 'relationship_txt'],
    ['relationship_generatedid', 'relationship_txt'],
    ['relationship_link', 'relationship_txt'],

    ['relationship_numeric', 'relationship_num'],

    ['relationship_date', 'relationship_date'],
    ['relationship_multidate', 'relationship_date'],

    ['relationship_daterange', 'relationship_range'],
    ['relationship_multidaterange', 'relationship_range'],

    ['relationship_select', 'relationship_select'],
    ['relationship_multiselect', 'relationship_select'],

    ['relationship_geolocation', 'relationship_geolocation'],

    ['geolocation', 'geolocation'],
  ]);

  private static slotTypes = Array.from(new Set(this.propertyTypeSlotTypeDictionary.values()));

  private static slotTypePropertyTypeDictionary = new Map<SlotType, PropertyType>([
    ['txt', 'text'],
    ['date', 'date'],
    ['num', 'numeric'],
    ['range', 'daterange'],
    ['select', 'select'],
    ['relationship', 'relationship'],
    ['geolocation', 'geolocation'],

    ['relationship_txt', 'relationship'],
    ['relationship_num', 'relationship'],
    ['relationship_date', 'relationship'],
    ['relationship_range', 'relationship'],
    ['relationship_select', 'relationship'],
    ['relationship_geolocation', 'relationship'],
  ]);

  static toSlotType(propertyType: PropertyType): SlotType | undefined {
    return this.propertyTypeSlotTypeDictionary.get(propertyType);
  }

  static slotList(): SlotType[] {
    return [...this.slotTypes];
  }

  static toPropertyType(slotType: SlotType): PropertyType | undefined {
    return this.slotTypePropertyTypeDictionary.get(slotType);
  }

  static createSlotName(slotType: SlotType, index: number): string {
    return `${slotType}_${index.toString().padStart(2, '0')}`;
  }
}

export { AmountPerSlotType, SlotsMapper };
export type { SlotType };
