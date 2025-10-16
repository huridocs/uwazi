import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
} from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { MetadataObjectSchema } from 'shared/types/commonTypes';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): RelationshipMetadataProperty['values'] {
    return property.value.map((rel: MetadataObjectSchema) => ({
      value: rel.value?.toString() || '',
      label: rel.label,
      url: '/entity/' + (rel.value?.toString() || ''),
      icon: rel.icon as any,
    }));
  }
}
