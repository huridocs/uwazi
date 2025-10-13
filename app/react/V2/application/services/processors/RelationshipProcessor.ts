import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext } from './types';

export class RelationshipProcessor extends BasePropertyProcessor {
  readonly name = 'RelationshipProcessor';
  readonly propertyTypes = ['relationship'];

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
          label: '',
          displayValue: '',
        };
      }

      return {
        value: rel.value || rel,
        label: rel.label || rel.displayValue || rel.toString(),
        displayValue: rel.displayValue || rel.label || rel.toString(),
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
    const { nestedLevel, includeEntityData, includeTemplates, maxRelationships } = {
      nestedLevel: context.nestedLevel,
      includeEntityData: context.includeEntityData,
      includeTemplates: context.includeTemplates,
      maxRelationships: context.maxRelationships,
    };

    const values = Array.isArray(property.value) ? property.value : [property.value];
    const isInherited = property.inherited === true;

    const limitedValues = maxRelationships ? values.slice(0, maxRelationships) : values;

    return limitedValues.map((rel: any): PropertyValue => {
      const baseValue = {
        value: rel.value || rel,
        label: rel.label || rel.displayValue || rel.toString(),
        displayValue: rel.displayValue || rel.label || rel.toString(),
      };

      const relationshipValue: PropertyValue = { ...baseValue };

      if (!isInherited) {
        relationshipValue.icon = rel.icon || '';
        relationshipValue.url = rel.url || '';
      }

      if (includeEntityData && rel.relationshipData) {
        relationshipValue.relationshipData = {
          entityId: rel.relationshipData.entityId,
          entityTitle: rel.relationshipData.entityTitle,
          relationshipType: rel.relationshipData.relationshipType,
          template: includeTemplates ? rel.relationshipData.template : undefined,
        };
      }

      if (nestedLevel && nestedLevel > 1) {
        relationshipValue.nestedLevel = nestedLevel;
      }

      return relationshipValue;
    });
  }
}
