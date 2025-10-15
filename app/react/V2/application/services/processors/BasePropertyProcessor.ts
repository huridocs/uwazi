import { AllowedPropertyTypes, MetadataProperty } from 'app/V2/domain/entities/types';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import {
  AdapterMetadataProperty,
  ProcessingContext,
  PropertyTypeProcessor,
} from './types';
import { AdapterEntityProcessor } from './AdapterEntityProcessor';

export abstract class BasePropertyProcessor implements PropertyTypeProcessor {
  abstract readonly name: string;

  abstract readonly propertyTypes: string[];

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    _processors?: Map<string, PropertyTypeProcessor>
  ): Map<string, AdapterMetadataProperty> {
    const results = new Map<string, Omit<AdapterMetadataProperty, 'values'> & { values: any }>(); // definir una abstraccion para values

    properties.forEach(property => {
      try {
        const key = `${property.entity._id}:${property.name}`;
        const values = this.formatProperty(property, context);
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
        });
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): MetadataProperty["values"] {
    if (!property.value) {
      return [];
    }
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((v: PropertyValueSchema) => ({
      value: v,
    }));
  }

  // protected getTranslatedLabel(
  //   property: AdapterMetadataProperty,
  //   propertyName: string,
  //   context: ProcessingContext
  // ): string | undefined {
  //   if (!context.translateLabels || !context.translations) {
  //     return undefined;
  //   }
  //   const translationKey = property.label || propertyName; //TODO: ensure the value
  //   return (
  //     context.translations
  //       .find(t => t.locale === context.language)
  //       ?.contexts.find(t => t.id === property._id)?.values[translationKey] || undefined
  //   );
  // }
}
