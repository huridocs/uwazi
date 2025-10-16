import { BasePropertyProcessor } from './BasePropertyProcessor';
import { AdapterMetadataProperty, ProcessingContext } from './types';
import { SimpleMetadataProperty } from 'app/V2/domain/entities/types';

export class DefaultPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DefaultPropertyProcessor';

  readonly propertyTypes: string[] = ['any'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): SimpleMetadataProperty['values'] {
    return property.value as SimpleMetadataProperty['values'];
  }
}
