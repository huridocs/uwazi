import { FilePropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext } from './types';

export class FileProcessor extends BasePropertyProcessor {
  readonly name = 'FileProcessor';

  readonly propertyTypes: FilePropertyTypes[] = ['image', 'media', 'file'];

  protected formatProperty(property: any, context: ProcessingContext): PropertyValue[] {
    if (this.shouldSkipFormatting(context, 'file')) {
      return this.createRawValues(property);
    }

    return this.formatFileProperty(property, context);
  }

  protected createRawValues(property: any): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((file: any) => {
      if (!file) {
        return {
          value: file,
          displayValue: '',
        };
      }

      let { value } = file;
      if (value && typeof value === 'object' && value.value) {
        value = value.value;
      }

      const fileName =
        file.fileName ||
        file.originalname ||
        (typeof value === 'string' ? value.split('/').pop() : 'Unknown');
      const label = file.label || fileName;

      return {
        value,
        label,
        displayValue: label,
        alt: file.alt, // Preserve alt text for accessibility
        ...file, // Preserve any additional properties
      };
    });
  }

  protected shouldSkipFormatting(context: ProcessingContext, formatKey?: string): boolean {
    if (formatKey === 'file') {
      return context.includeFiles === false;
    }
    return false;
  }

  private formatFileProperty(property: any, context: ProcessingContext): PropertyValue[] {
    const fileFormatting = {
      includeFileMetadata: context.includeFileMetadata,
      includeThumbnails: context.includeThumbnails,
      maxFileSize: context.maxFileSize,
      allowedTypes: context.allowedTypes,
    };
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((file: any) => {
      if (!file) {
        return {
          value: file,
          label: '',
          displayValue: '',
          error: 'Invalid file',
        };
      }

      // Handle nested value structures: { value: { value: "/api/files/..." } }
      let actualValue = file.value;
      if (actualValue && typeof actualValue === 'object' && actualValue.value) {
        actualValue = actualValue.value;
      }

      if (fileFormatting.maxFileSize && file.size && file.size > fileFormatting.maxFileSize) {
        return {
          value: actualValue,
          label: 'File too large',
          displayValue: 'File too large',
          error: 'File too large',
        };
      }

      if (
        fileFormatting.allowedTypes &&
        file.type &&
        !fileFormatting.allowedTypes.includes(file.type)
      ) {
        return {
          value: actualValue,
          label: 'File type not allowed',
          displayValue: 'File type not allowed',
          error: 'File type not allowed',
        };
      }

      const fileName =
        file.fileName ||
        file.originalname ||
        (typeof actualValue === 'string' ? actualValue.split('/').pop() : 'Unknown');
      const url = file.url || actualValue || '';
      const type = file.type || 'unknown';
      const size = file.size || 0;
      const style = file.style || 'default';
      const label = file.label || fileName;

      const formattedValue: any = {
        fileName,
        url,
        type,
        style,
        label,
      };

      if (fileFormatting.includeFileMetadata) {
        formattedValue.size = size;
        formattedValue.mimeType = file.mimeType;
        formattedValue.uploadDate = file.uploadDate;
      }

      if (fileFormatting.includeThumbnails && file.thumbnail) {
        formattedValue.thumbnail = file.thumbnail;
      }

      return {
        value: actualValue, // Return the direct URL value, not nested object
        label: label || fileName,
        displayValue: label || fileName,
        formattedValue,
      };
    });
  }
}
