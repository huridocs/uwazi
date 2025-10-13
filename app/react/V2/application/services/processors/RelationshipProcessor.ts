import { RelationshipPropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  async processBatch(properties: any[], context: ProcessingContext): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatProperty(property, context);
        const isInherited = property.inherited === true;

        // Build relationship-specific metadata
        const relationshipMetadata: any = {
          inherited: isInherited,
          relationshipName: property.relationshipName,
          properties: {
            template: property.template
              ? {
                _id: property.template._id,
                name: property.template.name,
                label: property.template.label,
                color: property.template.color,
              }
              : undefined,
            inheritedProperty: property.inheritedProperty
              ? {
                type: property.inheritedProperty.type,
                name: property.inheritedProperty.name,
                label: property.inheritedProperty.label,
              }
              : undefined,
          },
        };

        results.set(key, {
          ...property,
          values,
          ...relationshipMetadata,
        });
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(property: any, context: ProcessingContext): PropertyValue[] {
    if (this.shouldSkipFormatting(context, 'relationship')) {
      return this.createRawValues(property);
    }

    return this.formatRelationshipProperty(property, context);
  }

  protected createRawValues(property: any): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((rel: any): PropertyValue => {
      if (!rel) {
        return {
          value: rel,
          displayValue: '',
        };
      }

      const value = rel.value || rel;
      const label = rel.label || rel.displayValue || rel.toString();
      const sharedId = typeof value === 'string' ? value : value?.sharedId || value?.id;

      // Construct URL if not provided
      const url = rel.url || (sharedId ? `/entity/${sharedId}` : undefined);

      // Use provided icon or get from target entity info
      const icon = rel.icon || rel.targetIcon || '';

      return {
        value: value, // Keep the original value
        label,
        url: url || '#', // Ensure url is always present
        icon,
      };
    });
  }

  protected shouldSkipFormatting(context: ProcessingContext, formatKey?: string): boolean {
    if (formatKey === 'relationship') {
      return context.includeRelationships === false;
    }
    return false;
  }

  protected getCustomFormat(
    _context: ProcessingContext,
    formatKey: string,
    defaultFormat: string
  ): string {
    if (formatKey === 'relationship') {
      return defaultFormat;
    }
    return defaultFormat;
  }

  private formatRelationshipProperty(property: any, context: ProcessingContext): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    const limitedValues = context.maxRelationships
      ? values.slice(0, context.maxRelationships)
      : values;

    return limitedValues.map((rel: any): PropertyValue => {
      const label = rel.label || rel.displayValue || rel.toString();
      const url = rel.url || '#';
      const icon = rel.icon || '';

      return {
        value: rel.value || rel, // Keep the original value
        label,
        url,
        icon,
      };
    });
  }
}
