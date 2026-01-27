import { MetadataProperty } from '#V2/domain/entities/types.js';
import { reportErrorToSentry } from '#V2/shared/errorUtils.js';
import {
  AdapterMetadataProperty,
  ProcessingContext,
  PropertyTypeProcessor,
} from '#V2/application/services/processors/types.js';

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
        reportErrorToSentry(
          error as Error,
          `Error processing ${this.name} property ${property.name}`
        );
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
