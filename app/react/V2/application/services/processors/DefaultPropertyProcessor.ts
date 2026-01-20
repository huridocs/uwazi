import { SimpleMetadataProperty } from '#V2/domain/entities/types.js';
import { BasePropertyProcessor } from '#V2/application/services/processors/BasePropertyProcessor.js';
import { AdapterMetadataProperty, ProcessingContext } from '#V2/application/services/processors/types.js';

export class DefaultPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DefaultPropertyProcessor';

  readonly propertyTypes: string[] = ['any'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): SimpleMetadataProperty['values'] {
    return property.value.map(value => ({ value: value.value?.toString() || '' }));
  }
}
