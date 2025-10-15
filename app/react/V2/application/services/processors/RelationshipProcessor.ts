import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
} from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, AdapterMetadataProperty } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): RelationshipMetadataProperty['values'] {
    if (this.shouldSkipFormatting(context, 'relationship')) {
      return this.createRawValues(property);
    }

    const values = Array.isArray(property.value) ? property.value : [property.value];

    const limitedValues = context.maxRelationships
      ? values.slice(0, context.maxRelationships)
      : values;

    return limitedValues.map((rel: any) => {
      const label = rel.label || rel.displayValue || rel.toString();
      const url = rel.url || '#';
      const icon = rel.icon || '';

      return {
        value: rel.value || rel,
        label,
        url,
        icon,
        inheritedValue: rel.inheritedValue,
        inheritedType: rel.inheritedType,
      };
    });
  }

  protected createRawValues(
    property: AdapterMetadataProperty
  ): RelationshipMetadataProperty['values'] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((rel: any) => {
      if (!rel) {
        return {
          value: rel,
          label: '',
        };
      }

      const value = rel.value || rel;
      const label = rel.label || rel.displayValue || rel.toString();
      const sharedId = typeof value === 'string' ? value : value?.sharedId || value?.id;

      const url = rel.url || (sharedId ? `/entity/${sharedId}` : undefined);
      const icon = rel.icon || rel.targetIcon || '';

      return {
        value,
        label,
        url: url || '#',
        icon,
        inheritedValue: rel.inheritedValue,
        inheritedType: rel.inheritedType,
      };
    });
  }

  protected shouldSkipFormatting(context: ProcessingContext, formatKey?: string): boolean {
    if (formatKey === 'relationship') {
      return context.includeRelationships === false;
    }
    return false;
  }
}
