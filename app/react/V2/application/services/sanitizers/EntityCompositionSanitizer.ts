import { EntitySchema } from 'shared/types/entityType';

export class EntityCompositionSanitizer {
  sanitizeComposedEntity(composedEntity: any): EntitySchema {
    const sanitizedEntity = { ...composedEntity };
    delete sanitizedEntity.compositionMetadata;
    delete sanitizedEntity.formattedProperties;

    if (composedEntity.metadata) {
      sanitizedEntity.metadata = this.sanitizeComposedMetadata(composedEntity.metadata);
    }

    return sanitizedEntity;
  }

  private sanitizeComposedMetadata(metadata: any): Record<string, any[]> {
    const sanitizedMetadata: Record<string, any[]> = {};

    Object.keys(metadata).forEach(propertyName => {
      const property = metadata[propertyName];

      if (this.isFormattedProperty(property)) {
        sanitizedMetadata[propertyName] = property.values.map((value: any) => ({
          value: value.value,
          label: value.label,
        }));
      } else if (Array.isArray(property)) {
        sanitizedMetadata[propertyName] = property.map(item => this.ensureValueStructure(item));
      } else {
        sanitizedMetadata[propertyName] = [{ value: property }];
      }
    });

    return sanitizedMetadata;
  }

  sanitizeFormData(formData: any, template: any): Partial<EntitySchema> {
    const sanitizedEntity: Partial<EntitySchema> = {
      title: formData.title,
      template: template._id || template,
      language: formData.language || 'en',
    };

    const metadata: Record<string, any[]> = {};

    Object.keys(formData).forEach(key => {
      if (key !== 'title' && key !== 'template' && key !== 'language') {
        const value = formData[key];
        if (Array.isArray(value)) {
          metadata[key] = value.map(v => ({ value: v }));
        } else {
          metadata[key] = [{ value }];
        }
      }
    });

    if (Object.keys(metadata).length > 0) {
      sanitizedEntity.metadata = metadata;
    }

    return sanitizedEntity;
  }

  private isFormattedProperty(property: any): boolean {
    return (
      property &&
      typeof property === 'object' &&
      'values' in property &&
      'type' in property &&
      'name' in property
    );
  }

  private ensureValueStructure(item: any): any {
    if (typeof item === 'object' && item !== null) {
      if ('value' in item) return item;
      return { value: item };
    }
    return { value: item };
  }
}

export default EntityCompositionSanitizer;
