import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
} from 'app/V2/domain/entities/types';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, AdapterMetadataProperty } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): RelationshipMetadataProperty['values'] {
    return property.value.map(({ value, label, icon }: MetadataObjectSchema) => ({
      value: value?.toString() || '',
      label: label || '',
      url: '/entity/' + (value?.toString() || ''),
      icon: (icon as any)?._id || '',
    }));
  }
}
