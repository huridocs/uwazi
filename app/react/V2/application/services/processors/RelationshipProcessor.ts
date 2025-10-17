import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
} from 'app/V2/domain/entities/types';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, AdapterMetadataProperty } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): RelationshipMetadataProperty['values'] {
    const result: MetadataObjectSchema[] = [];

    property.value.forEach(({ value, label, icon, inheritedValue, source, parent }: any) => {
      if (source) {
        result.push({
          value: value?.toString() || '',
          label: label || '',
          source,
          parent,
        });
      } else if (inheritedValue && Array.isArray(inheritedValue) && inheritedValue.length > 0) {
        inheritedValue.forEach((inherited: MetadataObjectSchema) => {
          result.push({
            value: inherited.value?.toString() || '',
            label: inherited.label || '',
            source: {
              value: value?.toString() || '',
              label: label || '',
              url: '/entityv2/' + (inherited.value?.toString() || ''),
              icon: (icon as any)?._id || '',
            },
            parent: inherited.parent,
          });
        });
      } else {
        result.push({
          value: value?.toString() || '',
          label: label || '',
          url: '/entityv2/' + (value?.toString() || ''),
          icon: (icon as any)?._id || '',
        });
      }
    });

    return result as RelationshipMetadataProperty['values'];
  }
}
