import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
} from '#V2/domain/entities/types.js';
import { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import { BasePropertyProcessor } from '#V2/application/services/processors/BasePropertyProcessor.js';
import { ProcessingContext, AdapterMetadataProperty } from '#V2/application/services/processors/types.js';
import { DEFAULT_ENTITY_BASE_PATH } from '#V2/application/optionsPresets.js';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
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
              url: context.entityBasePath || DEFAULT_ENTITY_BASE_PATH + (value?.toString() || ''),
              icon: (icon as any)?._id || '',
            },
            parent: inherited.parent,
          });
        });
      } else if (!property.properties.inherited) {
        result.push({
          value: value?.toString() || '',
          label: label || '',
          url: context.entityBasePath || DEFAULT_ENTITY_BASE_PATH + (value?.toString() || ''),
          icon: (icon as any)?._id || '',
        });
      }
    });

    return result as RelationshipMetadataProperty['values'];
  }
}
