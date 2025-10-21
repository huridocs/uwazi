import { ImageMetadataProperty } from 'app/V2/domain/entities/types';
import { reportErrorToSentry } from 'app/V2/shared/errorUtils';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class ImagePropertyProcessor extends BasePropertyProcessor {
  readonly name = 'ImagePropertyProcessor';

  readonly propertyTypes: string[] = ['image'];

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext
  ): AdapterMetadataProperty[] {
    const results: AdapterMetadataProperty[] = [];

    properties.forEach(property => {
      try {
        const values = this.processImageFiles(property.value, context);
        results.push(Object.assign(property, { values }));
      } catch (error) {
        reportErrorToSentry(
          error as Error,
          `Error processing ${this.name} property ${property.name}`
        );
      }
    });

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): ImageMetadataProperty['values'] {
    return this.processImageFiles(property.value, context);
  }

  private processImageFiles(
    value: MetadataObjectSchema[],
    _context: ProcessingContext
  ): ImageMetadataProperty['values'] {
    if (!value) {
      return [];
    }

    const values = Array.isArray(value) ? value : [value];

    return values.flatMap((imageValue: MetadataObjectSchema) => {
      if (typeof imageValue === 'string') {
        return [{ value: imageValue as string, alt: 'Image not described' }];
      }

      return [
        {
          value: imageValue.value?.toString() || '',
          alt: imageValue.alt?.toString() || 'Image not described',
        },
      ];
    });
  }
}
