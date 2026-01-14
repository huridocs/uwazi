import { SimpleMetadataProperty } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { AdapterMetadataProperty, ProcessingContext } from './types';

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
