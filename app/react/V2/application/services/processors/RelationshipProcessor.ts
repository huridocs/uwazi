import { RelationshipPropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext, FormattedProperty } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes: RelationshipPropertyTypes[] = ['relationship'];

  processBatch(properties: any[], context: ProcessingContext): Map<string, FormattedProperty> {
    const results = new Map<string, FormattedProperty>();

    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatProperty(property, context);
        const isInherited = property.inherited === true;

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

      const url = rel.url || (sharedId ? `/entity/${sharedId}` : undefined);
      const icon = rel.icon || rel.targetIcon || '';

      return {
        value: value,
        label,
        url: url || '#',
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

    const allInheritedValues = this.collectAllInheritedValues(values);

    const allValues = [...values, ...allInheritedValues];

    const limitedValues = context.maxRelationships
      ? allValues.slice(0, context.maxRelationships)
      : allValues;

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

  private collectAllInheritedValues(values: any[]): any[] {
    const allInherited: any[] = [];

    values.forEach(value => {
      if (value.inheritedValue && Array.isArray(value.inheritedValue)) {
        allInherited.push(...value.inheritedValue);
        allInherited.push(...this.collectAllInheritedValues(value.inheritedValue));
      }
    });

    return allInherited;
  }
}
