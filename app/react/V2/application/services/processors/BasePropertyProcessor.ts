import { ComposedProperty } from 'app/V2/domain/entities/types';
import {
  FormattedProperty,
  PropertyValue,
  PropertyMetadata,
  ProcessingContext,
  PropertyTypeProcessor,
} from './types';

export abstract class BasePropertyProcessor implements PropertyTypeProcessor {
  abstract readonly name: string;
  abstract readonly propertyTypes: string[];

  processBatch(properties: any[], context: ProcessingContext): Map<string, FormattedProperty> {
    const results = new Map<string, FormattedProperty>();

    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatProperty(property, context);
        results.set(key, { ...property, values });
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });

    return results;
  }

  protected formatProperty(
    property: ComposedProperty,
    _context: ProcessingContext
  ): PropertyValue[] {
    return this.createRawValues(property);
  }

  protected createRawValues(property: ComposedProperty): PropertyValue[] {
    return [
      {
        value: property.value,
        label: property.value?.toString() || '',
        displayValue: property.value?.toString() || '',
      },
    ];
  }

  protected shouldSkipFormatting(_context: ProcessingContext, _formatKey?: string): boolean {
    return false;
  }

  protected getCustomFormat(
    _context: ProcessingContext,
    _formatKey: string,
    defaultFormat: string
  ): string {
    return defaultFormat;
  }

  protected getPropertyLabel(property: ComposedProperty, _fieldName: string): string {
    return property.label || property.name || _fieldName;
  }

  protected getTranslatedLabel(
    property: any,
    fieldName: string,
    context: ProcessingContext
  ): string | undefined {
    if (!context.translateLabels || !context.translations) {
      return undefined;
    }

    const translationKey = property.translateContext || fieldName;
    return (
      context.translations
        .find(t => t.locale === context.language)
        ?.contexts.find(t => t.id === property._id)?.values[translationKey] || undefined
    );
  }

  protected buildPropertyMetadata(
    property: any,
    _fieldName: string,
    _context: ProcessingContext
  ): PropertyMetadata {
    return {
      showInCard: property.showInCard || false,
      propertyType: property.type,
      isInherited: this.isInheritedProperty(property),
      isRequired: property.required || false,
      isMultiple: property.multiple || false,
      noLabel: property.noLabel || false,
      fullWidth: property.fullWidth || false,
      obsolete: property.obsolete || false,
      indexInTemplate: property.indexInTemplate,
      parent: property.parent,
      translateContext: property.translateContext,
      fileName: property.fileName,
      timeLinks: property.timeLinks,
      relatedEntity: property.relatedEntity,
      inheritedType: property.inheritedType,
      inheritedValue: property.inheritedValue,
      denormalizedProperty: property.denormalizedProperty,
      sortedBy: property.sortedBy,
      timestamp: property.timestamp,
      style: property.style,
      url: property.url,
      icon: property.icon,
    };
  }

  protected isInheritedProperty(property: any): boolean {
    return !!(
      property.inherited ||
      property.inheritedType ||
      property.inheritedValue ||
      property.originalValue
    );
  }
}
