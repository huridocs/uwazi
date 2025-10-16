import { MetadataProperty } from 'app/V2/domain/entities/types';
import { AdapterMetadataProperty, ProcessingContext, PropertyTypeProcessor } from './types';

export abstract class BasePropertyProcessor implements PropertyTypeProcessor {
  abstract readonly name: string;

  abstract readonly propertyTypes: string[];

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    _processors?: Map<string, PropertyTypeProcessor>
  ): AdapterMetadataProperty[] {
    const results: AdapterMetadataProperty[] = [];

    properties.forEach(property => {
      try {
        const values = this.formatProperty(property, context);
        results.push(Object.assign(property, { values }));
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): MetadataProperty['values'] {
    if (!property.value) {
      return [];
    }
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((value: any) => ({ value }));
  }
}
