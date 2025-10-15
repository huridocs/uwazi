import { MetadataProperty, EntityPermissions } from 'app/V2/domain/entities/types';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { AdapterMetadataProperty, ProcessingContext, PropertyTypeProcessor } from './types';

export abstract class BasePropertyProcessor implements PropertyTypeProcessor {
  abstract readonly name: string;

  abstract readonly propertyTypes: string[];

  protected pushProperty(
    property: AdapterMetadataProperty,
    values: Exclude<MetadataProperty, EntityPermissions>['values'],
    results: Map<string, AdapterMetadataProperty>
  ) {
    const key = `${property.entity._id}:${property.name}`;
    results.set(key, {
      _id: property._id,
      entity: property.entity,
      index: property.index,
      type: property.type,
      name: property.name,
      label: property.label,
      translatedLabel: property.translatedLabel,
      values,
      inherited: property.inherited || false,
      inheritedType: property.inheritedType,
      properties: property.properties,
      value: property.value, //TODO: check if this can be used somehow else
    } as AdapterMetadataProperty);
  }

  processBatch(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    _processors?: Map<string, PropertyTypeProcessor>
  ): Map<string, AdapterMetadataProperty> {
    const results = new Map<string, AdapterMetadataProperty>();

    properties.forEach(property => {
      try {
        const values = this.formatProperty(property as AdapterMetadataProperty, context);
        this.pushProperty(property as AdapterMetadataProperty, values, results);
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): Exclude<MetadataProperty, EntityPermissions>['values'] {
    if (!property.value) {
      return [];
    }
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((v: PropertyValueSchema) => ({
      value: v,
    }));
  }
}
