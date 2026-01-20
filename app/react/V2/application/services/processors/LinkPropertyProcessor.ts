import { LinkMetadataProperty, ValuePropertyTypes } from '#V2/domain/entities/types.js';
import { ProcessingContext, AdapterMetadataProperty } from '#V2/application/services/processors/types.js';
import { BasePropertyProcessor } from '#V2/application/services/processors/BasePropertyProcessor.js';
import { LinkSchema, MetadataObjectSchema } from '#shared/types/commonTypes.js';

export class LinkPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'LinkPropertyProcessor';
  readonly propertyTypes: ValuePropertyTypes[] = ['link'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): LinkMetadataProperty['values'] {
    return property.value.map((value: MetadataObjectSchema) => {
      const link = value.value as LinkSchema;
      return {
        value: link.url || '',
        label: link.label || '',
      };
    });
  }
}
