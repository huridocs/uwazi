import { LinkMetadataProperty, ValuePropertyTypes } from 'app/V2/domain/entities/types';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { LinkSchema, MetadataObjectSchema } from 'shared/types/commonTypes';

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
