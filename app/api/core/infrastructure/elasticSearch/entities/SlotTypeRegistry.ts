import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import type { SlotType } from './SlotType.js';

class SlotTypeRegistry {
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

  static toSlotType(
    propertyType: PropertyType,
    inheritedType?: PropertyType
  ): SlotType | undefined {
    return this.propertyTypeSlotTypeDictionary.get(
      inheritedType ? `${propertyType}_${inheritedType}` : propertyType
    );
  }
}

export { SlotTypeRegistry };
