import { has } from 'lodash';
import { ClientThesaurusValue, Template } from 'app/apiResponseTypes';
import { ClientTranslationContextSchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';
import { AdapterEntityTemplate, AdapterMetadataProperty, ProcessingContext } from './types';
import { ExtendedPropertyInfo, InheritedPropertyInfo } from 'app/V2/domain/entities/types';

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
    formattedProperties: Map<string, AdapterMetadataProperty>;
    formattedCommonProperties: Map<string, AdapterMetadataProperty>;
  } {
    const formattedProperties = new Map<string, AdapterMetadataProperty>();
    const formattedCommonProperties = new Map<string, AdapterMetadataProperty>();

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
    targetMap: Map<string, AdapterMetadataProperty>,
    templateTranslations?: ClientTranslationContextSchema
  ): void {
    properties.forEach((property: PropertySchema, index: number) => {
      const formattedProperty = this.formatPropertyDefinition(property, templateTranslations);
      targetMap.set(property.name, { ...formattedProperty, index });
    });
  }

  private getInheritedProperty(
    property: PropertySchema,
    templateTranslations?: ClientTranslationContextSchema
  ): InheritedPropertyInfo | undefined {
    const propertyTemplate = this.context.templates.find(
      template => template._id === property.content
    );
    const inheritedProperty = propertyTemplate?.properties?.find(
      (propertyDefinition: PropertySchema) => propertyDefinition._id === property.inherit?.property
    );
    if (inheritedProperty) {
      return {
        type: inheritedProperty.type,
        name: inheritedProperty.name,
        label: inheritedProperty.label,
        translatedLabel:
          templateTranslations?.values[inheritedProperty.label] || inheritedProperty.label,
      };
    }
    return undefined;
  }

  private formatPropertyDefinition(
    property: PropertySchema,
    templateTranslations?: ClientTranslationContextSchema
  ): AdapterMetadataProperty {
    const inheritedProperty = this.getInheritedProperty(property);
    let options;
    if (this.context.includeOptions) {
      const thesaurus = this.context.thesauri.find(t => t._id === property.content);

      options = thesaurus?.values.map(value => {
        const parent = has(value, 'parent') ? (value.parent as ClientThesaurusValue) : undefined;
        return {
          value: value.id || '',
          label: value.label || '',
          translatedLabel: templateTranslations?.values[value.label] || value.label,
          selected: false,
          parent: parent
            ? {
                value: parent.id || '',
                label: parent.label || '',
                translatedLabel: templateTranslations?.values[parent.label] || parent.label,
              }
            : undefined,
        };
      });
    }

    const properties: ExtendedPropertyInfo = {
      _id: property._id!.toString(),
      content: property.content,
      inherited: property.inherit !== undefined,
      inheritedProperty: inheritedProperty,
      options,
      hideLabel: property.noLabel,
      showInCard: property.showInCard,
      style: property.style,
    };
    return Object.assign({} as AdapterMetadataProperty, property, {
      _id: property._id!.toString(),
      name: property.name,
      label: property.label,
      type: property.type,
      translatedLabel: templateTranslations?.values[property.label] || property.label,
      properties,
      values: [],
    });
  }
}
