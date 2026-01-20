import get from 'lodash/get.js';
import has from 'lodash/has.js';
import { FileType } from '#shared/types/fileType.js';
import { PreviewMetadataProperty, ValuePropertyTypes } from '#V2/domain/entities/types.js';
import { ProcessingContext, AdapterMetadataProperty } from '#V2/application/services/processors/types.js';
import { BasePropertyProcessor } from '#V2/application/services/processors/BasePropertyProcessor.js';

export class PreviewPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'PreviewPropertyProcessor';

  readonly propertyTypes: ValuePropertyTypes[] = ['preview'];

  protected formatProperty(
    property: AdapterMetadataProperty,
    _context: ProcessingContext
  ): PreviewMetadataProperty['values'] {
    const mainDocument = has(property.entity.rawEntity, 'documents.0')
      ? (get(property.entity.rawEntity, 'documents.0') as FileType)
      : null;
    return [
      {
        value: mainDocument?._id ? `/api/files/${mainDocument._id}.jpg` : '',
        alt: mainDocument?.originalname || 'Image not described',
      },
    ];
  }
}
