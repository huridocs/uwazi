import { SelectPropertyTypes } from 'app/V2/domain/entities/types';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import {
  FormattedProperty,
  PropertyValue,
  PropertyTypeProcessor,
  ProcessingContext,
} from './types';

export class SelectPropertyProcessor implements PropertyTypeProcessor {
  readonly name = 'SelectPropertyProcessor';
  readonly propertyTypes: SelectPropertyTypes[] = ['select', 'multiselect'];

  async processBatch(
    properties: any[],
    context: ProcessingContext
  ): Promise<Map<string, FormattedProperty>> {
    const results = new Map<string, FormattedProperty>();

    const { translations, thesauri } = context;
    const selectFormatting = {
      includeOptions: context.includeOptions,
      showLabels: true,
      showIcons: true,
      showUrls: true,
    };

    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatSelectProperty(property, selectFormatting, translations);

        const formattedProperty: FormattedProperty = { ...property, values };

        if (context.editionMode) {
          const selectedValues = Array.isArray(property.value) ? property.value : [property.value];
          const options = this.buildFlattenedOptions(
            property,
            selectedValues,
            thesauri,
            translations,
            selectFormatting
          );
          formattedProperty.options = options;
        }

        results.set(key, formattedProperty);
      } catch (error) {
        console.error(`Error processing select property ${property.name}:`, error);
      }
    });

    return results;
  }

  private formatSelectProperty(
    property: any,
    selectFormatting: any,
    translations: Record<string, any>
  ): PropertyValue[] {
    const { showLabels, showIcons, showUrls } = selectFormatting;

    if (property.value !== undefined && !property.options) {
      const values = Array.isArray(property.value) ? property.value : [property.value];

      return values.map((value: any): PropertyValue => {
        const label = showLabels ? value.toString() : '';
        return {
          value,
          label: showLabels ? label : undefined,
          displayValue: showLabels ? label : '',
          icon: showIcons ? property.icon : undefined,
          url: showUrls ? property.url : undefined,
        };
      });
    }

    if (property.options && Array.isArray(property.options)) {
      const values = Array.isArray(property.value) ? property.value : [property.value];

      return values.map((selectedValue: any): PropertyValue => {
        const option = property.options.find((opt: any) => opt.value === selectedValue);

        if (!option) {
          return {
            value: selectedValue,
            label: selectedValue.toString(),
            displayValue: selectedValue.toString(),
          };
        }

        const translatedLabel =
          translations[option.translateContext || option.label] || option.label;

        return {
          value: selectedValue,
          label: showLabels ? translatedLabel : undefined,
          displayValue: showLabels ? translatedLabel : '',
          icon: showIcons ? option.icon : undefined,
          url: showUrls ? option.url : undefined,
        };
      });
    }

    return [
      {
        value: property.value,
        label: property.value?.toString() || '',
        displayValue: property.value?.toString() || '',
      },
    ];
  }

  private findThesaurusByContentId(
    contentId: string,
    thesauri: ClientThesaurus[]
  ): ClientThesaurus | undefined {
    return thesauri.find(t => t._id === contentId);
  }

  private buildFlattenedOptions(
    property: any,
    selectedValues: any[],
    thesauri: ClientThesaurus[],
    translations: Record<string, any>,
    selectFormatting: any
  ): PropertyValue[] {
    const thesaurus = this.findThesaurusByContentId(property.content, thesauri);

    if (!thesaurus || !thesaurus.values) {
      return [];
    }

    const flattenedOptions: PropertyValue[] = [];

    thesaurus.values.forEach((option: ClientThesaurusValue) => {
      flattenedOptions.push({
        value: option.id,
        label: selectFormatting.showLabels ? translations[option.label] || option.label : undefined,
        displayValue: selectFormatting.showLabels ? translations[option.label] || option.label : '',
        selected: selectedValues.includes(option.id),
        group: null,
        level: 0,
      });

      if (option.values && Array.isArray(option.values)) {
        option.values.forEach((subOption: any) => {
          flattenedOptions.push({
            value: subOption.id,
            label: selectFormatting.showLabels
              ? translations[subOption.label] || subOption.label
              : undefined,
            displayValue: selectFormatting.showLabels
              ? translations[subOption.label] || subOption.label
              : '',
            selected: selectedValues.includes(subOption.id),
            group: option.id,
            level: 1,
          });
        });
      }
    });

    return flattenedOptions;
  }
}
