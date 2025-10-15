import { Template } from 'app/apiResponseTypes';
import { ClientTranslationContextSchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';
import { AdapterEntityTemplate, AdapterMetadataProperty, ProcessingContext } from './types';

export class AdapterTemplateProcessor {
  private readonly context: ProcessingContext;

  //in the future think to store this composition in an atom
  constructor(context: ProcessingContext) {
    this.context = context;
  }

  formatTemplateData(templatesIds: string[]): AdapterEntityTemplate[] {
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
    formattedProperties: Map<string, Partial<AdapterMetadataProperty>>;
    formattedCommonProperties: Map<string, Partial<AdapterMetadataProperty>>;
  } {
    const formattedProperties = new Map<string, Partial<AdapterMetadataProperty>>();
    const formattedCommonProperties = new Map<string, Partial<AdapterMetadataProperty>>();

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
    targetMap: Map<string, Partial<AdapterMetadataProperty>>,
    templateTranslations?: ClientTranslationContextSchema
  ): void {
    properties.forEach((property: PropertySchema, index: number) => {
      const formattedProperty = this.formatPropertyDefinition(property, templateTranslations);
      targetMap.set(property.name, { ...formattedProperty, index });
    });
  }

  private getInheritedProperty(
    property: PropertySchema
  ): Partial<AdapterMetadataProperty['properties']['inheritedProperty']> {
    const template = this.context.templates.find(template => template._id === property.content);
    const inheritedProperty = template?.properties?.find(
      property => property._id === property.inherit?.property
    );
    if (inheritedProperty) {
      return {
        property: inheritedProperty._id!.toString(),
        type: inheritedProperty.type,
        name: inheritedProperty.name,
        label: inheritedProperty.label,
      };
    }
    return undefined;
  }

  private formatPropertyDefinition(
    property: PropertySchema,
    templateTranslations?: ClientTranslationContextSchema
  ): Omit<AdapterMetadataProperty, 'values' | 'entity' | 'index'> {
    const inheritedProperty = this.getInheritedProperty(property);
    let options;
    if (this.context.includeOptions) {
      const thesaurus = this.context.thesauri.find(t => t._id === property.content);
      options = thesaurus?.values;
    }
    return {
      _id: property._id as string,
      name: property.name,
      label: property.label,
      type: property.type,
      properties: {
        _id: property._id!.toString(),
        content: property.content,
        inherited: property.inherit !== undefined,
        translatedLabel: templateTranslations?.values[property.label] || property.label,
        inheritedProperty: inheritedProperty as any, //TODO FIX 
        translationContext: templateTranslations,
        options: [],
      },
    };
  }
}
