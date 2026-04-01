import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import type { SlotType } from './SlotType.js';

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

class SlotBootstrapDefinitions {
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

  private static allSlotTypes: SlotType[] = [
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

  static slotList(): SlotType[] {
    return [...this.allSlotTypes];
  }

  static toPropertyType(slotType: SlotType): PropertyType | undefined {
    return this.slotTypePropertyTypeDictionary.get(slotType);
  }

  static createSlotName(slotType: SlotType, index: number): string {
    return `${slotType}_${index.toString().padStart(2, '0')}`;
  }
}

export { AmountPerSlotType, SlotBootstrapDefinitions };
