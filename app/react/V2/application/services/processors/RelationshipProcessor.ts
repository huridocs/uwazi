import {
  RelationshipMetadataProperty,
  RelationshipPropertyTypes,
  Icon,
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
    return property.value.map((rel: MetadataObjectSchema & { _inheritedSource?: any }) => ({
      value: rel.value?.toString() || '',
      label: rel.label || '',
      url: '/entity/' + (rel.value?.toString() || ''),
      icon: rel.icon as Icon,
      source: rel._inheritedSource
        ? {
            value: rel._inheritedSource.value,
            label: rel._inheritedSource.label,
            url: '/entity/' + (rel._inheritedSource.value?.toString() || ''),
          }
        : undefined,
    }));
  }
}
