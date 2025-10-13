import { Template } from 'app/apiResponseTypes';
import { ClientTranslationContextSchema } from 'app/istore';
import { ComposedTemplate } from 'app/V2/domain/entities/types';
import { PropertySchema } from 'shared/types/commonTypes';
import { ProcessingContext } from './types';

export class AdapterTemplateProcessor {
  private readonly context: ProcessingContext;

  constructor(context: ProcessingContext) {
    this.context = context;
  }

  formatTemplateData(templatesIds: string[]): ComposedTemplate[] {
    return this.context.templates
      .filter((template: Template) => templatesIds.includes(template._id))
      .map((template: Template) => {
        const templateTranslations = this.context.translateLabels
          ? this.getTemplateTranslations(template)
          : undefined;
        const { formattedProperties, formattedCommonProperties } = this.formatTemplateProperties(
          template,
          templateTranslations
        );

        let templateData = {};

        if (this.context.includeTemplate) {
          const label =
            templateTranslations !== undefined
              ? templateTranslations.values[template.name]
              : template.name;

          templateData = {
            label,
            color: template.color || '#000000',
            entityViewPage: template.entityViewPage || '',
          };
        }
        return {
          _id: template._id,
          name: template.name,
          ...templateData,
          commonProperties: formattedCommonProperties,
          properties: formattedProperties,
        };
      });
  }

  private getTemplateTranslations(template: Template): ClientTranslationContextSchema | undefined {
    if (!this.context.translateLabels || !this.context.translations) {
      return undefined;
    }

    return this.context.translations
      .find(t => t.locale === this.context.language)
      ?.contexts.find(t => t.id === template._id);
  }

  private formatTemplateProperties(
    template: Template,
    templateTranslations?: ClientTranslationContextSchema
  ): {
    formattedProperties: Map<string, any>;
    formattedCommonProperties: Map<string, any>;
  } {
    const formattedProperties = new Map<string, any>();
    const formattedCommonProperties = new Map<string, any>();

    const properties = this.filterPropertiesByIncludeFields(template.properties);
    const commonProperties = this.filterPropertiesByIncludeFields(template.commonProperties);

    this.formatAndSetProperties(properties, formattedProperties, templateTranslations);
    this.formatAndSetProperties(commonProperties, formattedCommonProperties, templateTranslations);

    return {
      formattedProperties,
      formattedCommonProperties,
    };
  }

  private filterPropertiesByIncludeFields(properties?: PropertySchema[]): PropertySchema[] {
    if (!properties) return [];

    if (this.context.includeFields) {
      return properties.filter(property => this.context.includeFields?.includes(property.name));
    }

    return properties;
  }

  private formatAndSetProperties(
    properties: PropertySchema[],
    targetMap: Map<string, any>,
    templateTranslations?: ClientTranslationContextSchema
  ): void {
    properties.forEach((property, index) => {
      const formattedProperty = this.formatPropertyDefinition(property, templateTranslations);
      targetMap.set(property.name, { ...formattedProperty, index });
    });
  }

  private formatPropertyDefinition(
    property: PropertySchema,
    templateTranslations?: ClientTranslationContextSchema
  ) {
    return {
      _id: property._id,
      name: property.name,
      label: property.label,
      type: property.type,
      ...(templateTranslations !== undefined
        ? {
            translatedLabel: templateTranslations.values[property.label] || property.label,
          }
        : {}),
    };
  }
}
