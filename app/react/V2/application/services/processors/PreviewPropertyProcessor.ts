import { PreviewMetadataProperty, ValuePropertyTypes } from 'app/V2/domain/entities/types';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { MetadataObjectSchema } from 'shared/types/commonTypes';

export class PreviewPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'PreviewPropertyProcessor';
  readonly propertyTypes: ValuePropertyTypes[] = ['preview'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): PreviewMetadataProperty['values'] {
    //[{ value: defaultDoc._id ? `/api/files/${defaultDoc._id}.jpg` : null }],
    return property.value.map((value: MetadataObjectSchema) => {
      const preview = value.value;
      return { value: preview?.toString() || '' };
    });
  }
}
